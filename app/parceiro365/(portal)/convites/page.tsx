import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { events } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { InvitesClient } from "./invites-client"

export default async function ConvitesModulePage({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const u = await requireUser()
  const sp = await searchParams
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

  // Já vem com um treinamento selecionado: o pedido por ?evento=id, ou o mais recente.
  const wanted = (sp?.evento || "").trim()
  const initialEventId = wanted && eventos.some((e) => e.id === wanted) ? wanted : eventos[0]?.id || ""

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader title="Imagem do convite" subtitle="Crie a arte para divulgar o treinamento" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <InvitesClient eventos={eventos} distribuidorNome={u.nome} initialEventId={initialEventId} />
      </div>
    </div>
  )
}
