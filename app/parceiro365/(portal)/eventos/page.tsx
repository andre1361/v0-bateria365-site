import { asc, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { events, rsvps, companies } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { EventsClient } from "./events-client"

function norm(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

export default async function EventosPage() {
  const u = await requireUser()
  const evs = await db.select().from(events).where(eq(events.distributorId, u.id)).orderBy(desc(events.createdAt))

  const ids = evs.map((e) => e.id)
  const allRsvps = ids.length
    ? await db.select().from(rsvps).where(inArray(rsvps.eventId, ids)).orderBy(desc(rsvps.createdAt))
    : []

  const comps = await db
    .select({ id: companies.id, nome: companies.nome, meta: companies.convidadosPrevistos })
    .from(companies)
    .where(eq(companies.distributorId, u.id))
    .orderBy(asc(companies.nome))
  const metaByName = new Map(comps.map((c) => [norm(c.nome), c.meta]))
  const empresas = comps.map((c) => ({ id: c.id, nome: c.nome }))

  const eventos = evs.map((e) => {
    const conf = allRsvps.filter((r) => r.eventId === e.id)
    const grupos = new Map<string, { empresa: string; count: number; meta: number }>()
    for (const r of conf) {
      const key = norm(r.empresa)
      const display = (r.empresa || "").trim() || "Sem empresa"
      const cur = grupos.get(key)
      if (cur) cur.count++
      else grupos.set(key, { empresa: display, count: 1, meta: key ? metaByName.get(key) ?? 0 : 0 })
    }
    const porEmpresa = Array.from(grupos.values()).sort((a, b) => b.count - a.count)
    return {
      id: e.id,
      titulo: e.titulo,
      modulo: e.modulo,
      dataISO: e.dataISO,
      horario: e.horario,
      cidade: e.cidade,
      local: e.local,
      responsavel: e.responsavel,
      instagram: e.instagram,
      template: e.template,
      slug: e.slug,
      confirmados: conf.map((r) => ({ id: r.id, nome: r.nome, telefone: r.telefone, email: r.email, empresa: r.empresa })),
      porEmpresa,
    }
  })

  return (
    <>
      <PageHeader title="Treinamentos" subtitle="Convite, presença, sorteio e certificados" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <EventsClient eventos={eventos} empresas={empresas} canEdit={false} />
      </main>
    </>
  )
}
