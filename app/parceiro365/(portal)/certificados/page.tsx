import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { emitLinks, students, companies, events, rsvps } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { CertificatesClient } from "./certificates-client"

export default async function CertificadosPage({ searchParams }: { searchParams: Promise<{ treino?: string }> }) {
  const u = await requireUser()
  const sp = await searchParams
  const treino = (sp?.treino || "").trim()

  const [link] = await db.select().from(emitLinks).where(eq(emitLinks.distributorId, u.id))
  const alunoRows = await db
    .select({ id: students.id, nome: students.nome, empresa: students.empresa, companyId: students.companyId })
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(asc(students.nome))
  const empresas = await db
    .select({ id: companies.id, nome: companies.nome })
    .from(companies)
    .where(eq(companies.distributorId, u.id))
    .orderBy(asc(companies.nome))

  let initialLista = ""
  let initialData = ""
  let treinoTitulo = ""
  if (treino) {
    const [ev] = await db
      .select({ id: events.id, titulo: events.titulo, dataISO: events.dataISO })
      .from(events)
      .where(and(eq(events.id, treino), eq(events.distributorId, u.id)))
    if (ev) {
      const conf = await db.select({ nome: rsvps.nome, empresa: rsvps.empresa }).from(rsvps).where(eq(rsvps.eventId, ev.id))
      initialLista = conf.map((c) => (c.empresa ? `${c.nome}, ${c.empresa}` : c.nome)).join("\n")
      initialData = ev.dataISO || ""
      treinoTitulo = ev.titulo
    }
  }

  return (
    <>
      <PageHeader title="Certificados" subtitle={treinoTitulo ? `Presentes de: ${treinoTitulo}` : "Entregue os certificados do treinamento"} />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <CertificatesClient
          distribuidor={u.nome}
          cidade={u.cidade}
          slug={link?.slug ?? null}
          alunos={alunoRows}
          empresas={empresas}
          initialLista={initialLista}
          initialData={initialData}
          initialTab={initialLista ? "lote" : undefined}
        />
      </main>
    </>
  )
}
