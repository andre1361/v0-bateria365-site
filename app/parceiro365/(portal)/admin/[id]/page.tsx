import { and, desc, eq, inArray } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/db"
import { users, events, rsvps } from "@/db/schema"
import { PageHeader } from "../../../page-header"
import { requireAdmin } from "../../../guard"
import { ManageClient } from "./manage-client"

export default async function ManageDistributorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const [d] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  if (!d) notFound()

  const evs = await db.select().from(events).where(eq(events.distributorId, id)).orderBy(desc(events.createdAt))
  const ids = evs.map((e) => e.id)
  const allRsvps = ids.length ? await db.select({ eventId: rsvps.eventId }).from(rsvps).where(inArray(rsvps.eventId, ids)) : []

  const treinos = evs.map((e) => ({
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
    confirmados: allRsvps.filter((r) => r.eventId === e.id).length,
  }))

  return (
    <>
      <PageHeader title={d.nome} subtitle="Treinamentos do distribuidor" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <ManageClient distribuidor={{ id: d.id, nome: d.nome, cidade: d.cidade }} treinos={treinos} />
      </main>
    </>
  )
}
