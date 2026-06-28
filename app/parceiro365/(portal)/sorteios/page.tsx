import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { students } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { RaffleClient } from "./raffle-client"

export default async function SorteiosPage() {
  const u = await requireUser()
  const rows = await db
    .select({ nome: students.nome })
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(asc(students.nome))
  const alunos = rows.map((r) => r.nome)

  return (
    <>
      <PageHeader title="Sorteios" subtitle="Sorteador ao vivo" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <RaffleClient alunos={alunos} />
      </main>
    </>
  )
}
