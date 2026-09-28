import { asc, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { companies, students, events, rsvps, sellers } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { CompaniesClient } from "./companies-client"
import { ImportCompanies } from "./import-companies-client"

function norm(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

function fmtDate(iso: string) {
  const p = (iso || "").split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso || ""
}

export default async function EmpresasPage() {
  const u = await requireUser()

  const comps = await db.select().from(companies).where(eq(companies.distributorId, u.id)).orderBy(asc(companies.nome))
  const sellersRows = await db
    .select({ id: sellers.id, nome: sellers.nome })
    .from(sellers)
    .where(eq(sellers.distributorId, u.id))
    .orderBy(asc(sellers.nome))
  const sellerById = new Map(sellersRows.map((s) => [s.id, s.nome]))
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
  const evs = await db
    .select({ id: events.id, slug: events.slug, titulo: events.titulo, dataISO: events.dataISO, horario: events.horario, local: events.local, cidade: events.cidade })
    .from(events)
    .where(eq(events.distributorId, u.id))
    .orderBy(desc(events.createdAt))
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
      sellerId: c.sellerId,
      sellerNome: c.sellerId ? sellerById.get(c.sellerId) ?? "" : "",
      cadastrados: alunos.length,
      confirmados: rsvpByEmpresa.get(norm(c.nome)) || 0,
      alunos: alunos.map((a) => ({ id: a.id, nome: a.nome, email: a.email, telefone: a.telefone })),
    }
  })

  const semEmpresa = studs.filter((s) => !s.companyId).length

  // Treinamento mais recente do distribuidor — base do link de convite por empresa.
  const ev0 = evs[0]
  const evento = ev0
    ? { slug: ev0.slug, titulo: ev0.titulo, dataFmt: fmtDate(ev0.dataISO), horario: ev0.horario, local: ev0.local, cidade: ev0.cidade }
    : null

  return (
    <>
      <PageHeader title="Empresas" subtitle="Clientes e convidados por empresa" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <ImportCompanies />
        <CompaniesClient empresas={empresas} semEmpresa={semEmpresa} sellers={sellersRows} evento={evento} distribuidorNome={u.nome} />
      </main>
    </>
  )
}
