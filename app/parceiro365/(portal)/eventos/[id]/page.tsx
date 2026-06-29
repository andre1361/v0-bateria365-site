import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/db"
import { events, rsvps, companies, users } from "@/db/schema"
import { PageHeader } from "../../../page-header"
import { requireUser } from "../../../guard"
import { TrainingHub } from "./training-hub"

function norm(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

export default async function TrainingHubPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser()
  const { id } = await params

  const [ev] = await db.select().from(events).where(and(eq(events.id, id), eq(events.distributorId, u.id)))
  if (!ev) notFound()

  const conf = await db
    .select({ id: rsvps.id, nome: rsvps.nome, telefone: rsvps.telefone, email: rsvps.email, empresa: rsvps.empresa })
    .from(rsvps)
    .where(eq(rsvps.eventId, ev.id))

  const comps = await db
    .select({ id: companies.id, nome: companies.nome, meta: companies.convidadosPrevistos })
    .from(companies)
    .where(eq(companies.distributorId, u.id))
    .orderBy(asc(companies.nome))
  const metaByName = new Map(comps.map((c) => [norm(c.nome), c.meta]))

  const grupos = new Map<string, { empresa: string; count: number; meta: number }>()
  for (const r of conf) {
    const key = norm(r.empresa)
    const display = (r.empresa || "").trim() || "Sem empresa"
    const cur = grupos.get(key)
    if (cur) cur.count++
    else grupos.set(key, { empresa: display, count: 1, meta: key ? metaByName.get(key) ?? 0 : 0 })
  }
  const porEmpresa = Array.from(grupos.values()).sort((a, b) => b.count - a.count)

  return (
    <>
      <PageHeader title={ev.titulo} subtitle="Passo a passo do treinamento" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <TrainingHub
          ev={{
            id: ev.id,
            titulo: ev.titulo,
            modulo: ev.modulo,
            dataISO: ev.dataISO,
            horario: ev.horario,
            cidade: ev.cidade,
            local: ev.local,
            responsavel: ev.responsavel,
            instagram: ev.instagram,
            slug: ev.slug,
          }}
          distNome={u.nome}
          confirmados={conf}
          porEmpresa={porEmpresa}
          empresas={comps.map((c) => ({ id: c.id, nome: c.nome }))}
        />
      </main>
    </>
  )
}
