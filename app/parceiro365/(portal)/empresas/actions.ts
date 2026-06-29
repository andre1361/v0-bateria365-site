"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { companies, students } from "@/db/schema"
import { requireUser } from "../../guard"

export type CompanyState = { error?: string; ok?: string }

function readFields(formData: FormData) {
  const previstos = String(formData.get("convidadosPrevistos") || "").replace(/\D/g, "")
  return {
    nome: String(formData.get("nome") || "").trim(),
    cidade: String(formData.get("cidade") || "").trim(),
    responsavel: String(formData.get("responsavel") || "").trim(),
    telefone: String(formData.get("telefone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    convidadosPrevistos: previstos ? Math.min(parseInt(previstos, 10), 100000) : 0,
    observacoes: String(formData.get("observacoes") || "").trim(),
  }
}

export async function saveCompany(_prev: CompanyState, formData: FormData): Promise<CompanyState> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  const f = readFields(formData)
  if (!f.nome) return { error: "Informe o nome da empresa." }

  if (id) {
    await db.update(companies).set(f).where(and(eq(companies.id, id), eq(companies.distributorId, u.id)))
    // mantém o nome desnormalizado nos alunos já vinculados
    await db
      .update(students)
      .set({ empresa: f.nome })
      .where(and(eq(students.companyId, id), eq(students.distributorId, u.id)))
    revalidatePath("/parceiro365/empresas")
    revalidatePath("/parceiro365/alunos")
    return { ok: "Empresa atualizada." }
  }

  await db.insert(companies).values({ ...f, distributorId: u.id })
  revalidatePath("/parceiro365/empresas")
  return { ok: "Empresa cadastrada." }
}

export async function deleteCompany(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return
  // FK com onDelete: set null — os alunos permanecem (apenas desvinculados).
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.distributorId, u.id)))
  revalidatePath("/parceiro365/empresas")
  revalidatePath("/parceiro365/alunos")
}

export async function addStudentToCompany(formData: FormData): Promise<void> {
  const u = await requireUser()
  const companyId = String(formData.get("companyId") || "")
  const nome = String(formData.get("nome") || "").trim()
  if (!companyId || !nome) return
  const [company] = await db
    .select({ id: companies.id, nome: companies.nome })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.distributorId, u.id)))
  if (!company) return
  await db.insert(students).values({
    distributorId: u.id,
    companyId: company.id,
    nome,
    email: String(formData.get("email") || "").trim(),
    telefone: String(formData.get("telefone") || "").trim(),
    empresa: company.nome,
  })
  revalidatePath("/parceiro365/empresas")
  revalidatePath("/parceiro365/alunos")
}

export async function removeStudent(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return
  await db.delete(students).where(and(eq(students.id, id), eq(students.distributorId, u.id)))
  revalidatePath("/parceiro365/empresas")
  revalidatePath("/parceiro365/alunos")
}
