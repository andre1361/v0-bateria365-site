import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { students } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { StudentsClient } from "./students-client"

export default async function AlunosPage() {
  const u = await requireUser()
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(desc(students.createdAt))
  const alunos = rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone,
    empresa: r.empresa,
  }))

  return (
    <>
      <PageHeader title="Alunos" subtitle="Cadastro e gestão" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <StudentsClient alunos={alunos} />
      </main>
    </>
  )
}
