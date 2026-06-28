import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireAdmin } from "../../guard"
import { AdminClient } from "./admin-client"

export default async function AdminPage() {
  await requireAdmin()
  const rows = await db.select().from(users).where(eq(users.role, "distribuidor")).orderBy(desc(users.createdAt))
  const distribuidores = rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    cidade: r.cidade,
    ativo: r.ativo,
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
