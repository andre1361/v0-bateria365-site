import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { emitLinks, students } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { CertificatesClient } from "./certificates-client"

export default async function CertificadosPage() {
  const u = await requireUser()
  const [link] = await db.select().from(emitLinks).where(eq(emitLinks.distributorId, u.id))
  const alunoRows = await db
    .select({ id: students.id, nome: students.nome, empresa: students.empresa })
    .from(students)
    .where(eq(students.distributorId, u.id))
    .orderBy(asc(students.nome))

  return (
    <>
      <PageHeader title="Certificados" subtitle="Emissão Bateria365" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <CertificatesClient distribuidor={u.nome} cidade={u.cidade} slug={link?.slug ?? null} alunos={alunoRows} />
      </main>
    </>
  )
}
