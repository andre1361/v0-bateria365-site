import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { emitLinks, students, companies } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { CertificatesClient } from "./certificates-client"

export default async function CertificadosPage() {
  const u = await requireUser()
  const [link] = await db.select().from(emitLinks).where(eq(emitLinks.distributorId, u.id))
  const alunoRows = await db
    .select({ id: students.id, nome: students.nome, empresa: students.empresa, companyId: students.companyId })
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(asc(students.nome))
  const empresas = await db
    .select({ id: companies.id, nome: companies.nome })
    .from(companies)
    .where(eq(companies.distributorId, u.id))
    .orderBy(asc(companies.nome))

  return (
    <>
      <PageHeader title="Certificados" subtitle="Entregue os certificados do treinamento" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <CertificatesClient distribuidor={u.nome} cidade={u.cidade} slug={link?.slug ?? null} alunos={alunoRows} empresas={empresas} />
      </main>
    </>
  )
}
