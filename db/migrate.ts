import { neon } from "@neondatabase/serverless"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Aplicador de migrations via driver HTTP do Neon (porta 443), pois o Postgres
// TCP (5432) pode estar bloqueado no ambiente. Mantém controle do que já rodou
// em uma tabela __migrations.
const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL ausente (.env.local).")

const sql = neon(url)
const rowsOf = (r: unknown): any[] => (Array.isArray(r) ? r : ((r as any)?.rows ?? []))

async function main() {
  await sql.query(
    "create table if not exists __migrations (name text primary key, applied_at timestamptz not null default now())",
  )
  const applied = new Set(rowsOf(await sql.query("select name from __migrations")).map((r) => r.name))

  const dir = join(process.cwd(), "db", "migrations")
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  let ran = 0
  for (const f of files) {
    if (applied.has(f)) {
      console.log(`= ${f} (já aplicada)`)
      continue
    }
    const content = readFileSync(join(dir, f), "utf8")
    const stmts = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean)
    console.log(`+ ${f}: ${stmts.length} statement(s)`)
    for (const stmt of stmts) await sql.query(stmt)
    await sql.query("insert into __migrations(name) values ($1)", [f])
    ran++
  }
  console.log(ran ? `Migrations aplicadas: ${ran}` : "Nada a aplicar.")
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("Falha na migration:", e)
    process.exit(1)
  },
)
