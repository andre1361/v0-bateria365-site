import { asc, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { students, companies } from "@/db/schema"
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
    companyId: r.companyId,
  }))
  const empresas = await db
    .select({ id: companies.id, nome: companies.nome })
    .from(companies)
    .where(eq(companies.distributorId, u.id))
    .orderBy(asc(companies.nome))

  return (
    <>
      <PageHeader title="Alunos" subtitle="Cadastro e gestão" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <StudentsClient alunos={alunos} empresas={empresas} />
      </main>
    </>
  )
}
