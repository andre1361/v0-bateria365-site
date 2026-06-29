import { asc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { companies, students, events, rsvps } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { CompaniesClient } from "./companies-client"

function norm(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

export default async function EmpresasPage() {
  const u = await requireUser()

  const comps = await db.select().from(companies).where(eq(companies.distributorId, u.id)).orderBy(asc(companies.nome))
  const studs = await db
    .select({
      id: students.id,
      nome: students.nome,
      email: students.email,
      telefone: students.telefone,
      companyId: students.companyId,
    })
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(asc(students.nome))

  // Confirmações (RSVP) dos eventos do distribuidor, agrupadas por nome de empresa.
  const evs = await db.select({ id: events.id }).from(events).where(eq(events.distributorId, u.id))
  const evIds = evs.map((e) => e.id)
  const rs = evIds.length ? await db.select({ empresa: rsvps.empresa }).from(rsvps).where(inArray(rsvps.eventId, evIds)) : []
  const rsvpByEmpresa = new Map<string, number>()
  for (const r of rs) {
    const k = norm(r.empresa)
    if (!k) continue
    rsvpByEmpresa.set(k, (rsvpByEmpresa.get(k) || 0) + 1)
  }

  const empresas = comps.map((c) => {
    const alunos = studs.filter((s) => s.companyId === c.id)
    return {
      id: c.id,
      nome: c.nome,
      cidade: c.cidade,
      responsavel: c.responsavel,
      telefone: c.telefone,
      email: c.email,
      convidadosPrevistos: c.convidadosPrevistos,
      observacoes: c.observacoes,
      cadastrados: alunos.length,
      confirmados: rsvpByEmpresa.get(norm(c.nome)) || 0,
      alunos: alunos.map((a) => ({ id: a.id, nome: a.nome, email: a.email, telefone: a.telefone })),
    }
  })

  const semEmpresa = studs.filter((s) => !s.companyId).length

  return (
    <>
      <PageHeader title="Empresas" subtitle="Clientes e convidados por empresa" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <CompaniesClient empresas={empresas} semEmpresa={semEmpresa} />
      </main>
    </>
  )
}
