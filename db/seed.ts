import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { users } from "./schema"

// Cria/atualiza o super admin a partir das variáveis de ambiente.
const url = process.env.DATABASE_URL
const email = process.env.SUPER_ADMIN_EMAIL
const senha = process.env.SUPER_ADMIN_PASSWORD

if (!url) throw new Error("DATABASE_URL ausente (.env.local).")
if (!email || !senha) throw new Error("SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD ausentes (.env.local).")

const db = drizzle(neon(url), { schema: { users } })

async function main() {
  const hash = await bcrypt.hash(senha as string, 10)
  const existing = await db.select().from(users).where(eq(users.email, email as string))
  if (existing.length) {
    await db
      .update(users)
      .set({ passwordHash: hash, role: "super_admin", ativo: true })
      .where(eq(users.email, email as string))
    console.log(`Super admin atualizado: ${email}`)
  } else {
    await db.insert(users).values({
      email: email as string,
      passwordHash: hash,
      role: "super_admin",
      nome: "Super Admin",
      cidade: "",
    })
    console.log(`Super admin criado: ${email}`)
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("Falha no seed:", e)
    process.exit(1)
  },
)
