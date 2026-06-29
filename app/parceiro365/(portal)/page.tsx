import Link from "next/link"
import { count, eq, type SQL } from "drizzle-orm"
import { db } from "@/db"
import { students, certificates, raffles, invites, users, companies } from "@/db/schema"
import { PageHeader } from "../page-header"
import { requireUser } from "../guard"

async function countWhere(table: any, cond?: SQL) {
  const base = db.select({ c: count() }).from(table)
  const [r] = await (cond ? base.where(cond) : base)
  return Number(r?.c ?? 0)
}

export default async function OverviewPage() {
  const u = await requireUser()
  const isAdmin = u.role === "super_admin"
  const uid = u.id

  const [alunos, empresasCount, certs, sorteios, convites] = await Promise.all([
    countWhere(students, isAdmin ? undefined : eq(students.distributorId, uid)),
    countWhere(companies, isAdmin ? undefined : eq(companies.distributorId, uid)),
    countWhere(certificates, isAdmin ? undefined : eq(certificates.distributorId, uid)),
    countWhere(raffles, isAdmin ? undefined : eq(raffles.distributorId, uid)),
    countWhere(invites, isAdmin ? undefined : eq(invites.distributorId, uid)),
  ])
  const distribuidores = isAdmin ? await countWhere(users, eq(users.role, "distribuidor")) : null

  const stats: { label: string; value: number }[] = [
    ...(isAdmin && distribuidores !== null ? [{ label: "Distribuidores", value: distribuidores }] : []),
    { label: "Alunos", value: alunos },
    { label: "Empresas", value: empresasCount },
    { label: "Certificados", value: certs },
    { label: "Sorteios", value: sorteios },
    { label: "Convites", value: convites },
  ]

  const actions = [
    ...(isAdmin
      ? [{ href: "/parceiro365/admin", emoji: "🏢", title: "Gerenciar distribuidores", desc: "Cadastre e edite parceiros." }]
      : []),
    { href: "/parceiro365/alunos", emoji: "👤", title: "Cadastrar aluno", desc: "Nome, e-mail, telefone e empresa." },
    { href: "/parceiro365/empresas", emoji: "🏢", title: "Cadastrar empresa", desc: "Convidados alinhados por empresa." },
    { href: "/parceiro365/certificados", emoji: "🏅", title: "Emitir certificado", desc: "Individual, em lote ou por link." },
    { href: "/parceiro365/convites", emoji: "✉️", title: "Gerar convite", desc: "Editor de convites integrado." },
    { href: "/parceiro365/sorteios", emoji: "🎁", title: "Novo sorteio", desc: "Sorteador online ao vivo." },
  ]

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Resumo da sua operação" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <div style={{ maxWidth: 1080 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
              gap: 16,
              marginBottom: 24,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#8a94a3",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#04377f", marginTop: 6, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: "#41506a", margin: "6px 2px 12px" }}>Ações rápidas</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: "1px solid #e6eaf1",
                  borderRadius: 14,
                  padding: 20,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div style={{ fontSize: 22 }}>{a.emoji}</div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1f2733", marginTop: 10 }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: "#8a94a3", marginTop: 3 }}>{a.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
