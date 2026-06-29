import { desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { events, rsvps } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { EventsClient } from "./events-client"

export default async function EventosPage() {
  const u = await requireUser()
  const evs = await db.select().from(events).where(eq(events.distributorId, u.id)).orderBy(desc(events.createdAt))

  const ids = evs.map((e) => e.id)
  const allRsvps = ids.length
    ? await db.select().from(rsvps).where(inArray(rsvps.eventId, ids)).orderBy(desc(rsvps.createdAt))
    : []

  const eventos = evs.map((e) => ({
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
    confirmados: allRsvps
      .filter((r) => r.eventId === e.id)
      .map((r) => ({ id: r.id, nome: r.nome, telefone: r.telefone, email: r.email, empresa: r.empresa })),
  }))

  return (
    <>
      <PageHeader title="Eventos" subtitle="Convites com confirmação de presença" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <EventsClient eventos={eventos} />
      </main>
    </>
  )
}
