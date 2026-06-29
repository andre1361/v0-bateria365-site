import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { events } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { InvitesClient } from "./invites-client"

export default async function ConvitesModulePage() {
  const u = await requireUser()
  const evs = await db.select().from(events).where(eq(events.distributorId, u.id)).orderBy(desc(events.createdAt))
  const eventos = evs.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    template: e.template,
    cidade: e.cidade,
    dataISO: e.dataISO,
    horario: e.horario,
    local: e.local,
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader title="Imagem do convite" subtitle="Crie a arte para divulgar o treinamento" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <InvitesClient eventos={eventos} distribuidorNome={u.nome} />
      </div>
    </div>
  )
}
