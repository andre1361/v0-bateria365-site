import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { users, events } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireAdmin } from "../../guard"
import { AdminClient } from "./admin-client"

export default async function AdminPage() {
  await requireAdmin()
  const rows = await db.select().from(users).where(eq(users.role, "distribuidor")).orderBy(desc(users.createdAt))
  const evs = await db.select({ distributorId: events.distributorId }).from(events)
  const countByDist = new Map<string, number>()
  for (const e of evs) countByDist.set(e.distributorId, (countByDist.get(e.distributorId) || 0) + 1)
  const distribuidores = rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    cidade: r.cidade,
    ativo: r.ativo,
    treinos: countByDist.get(r.id) || 0,
  }))

  return (
    <>
      <PageHeader title="Distribuidores" subtitle="Cadastro e gestão de parceiros" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <AdminClient distribuidores={distribuidores} />
      </main>
    </>
  )
}
