"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { companies, students, sellers } from "@/db/schema"
import { requireUser } from "../../guard"

export type CompanyState = { error?: string; ok?: string }

function normName(x: string) {
  return (x || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

// Resolve um vendedor existente por nome (normalizado) ou cria um novo.
async function resolveSeller(distributorId: string, nome: string): Promise<string | null> {
  const n = normName(nome)
  if (!n) return null
  const existing = await db.select({ id: sellers.id, nome: sellers.nome }).from(sellers).where(eq(sellers.distributorId, distributorId))
  const match = existing.find((s) => normName(s.nome) === n)
  if (match) return match.id
  const [created] = await db.insert(sellers).values({ distributorId, nome: nome.trim() }).returning({ id: sellers.id })
  return created?.id ?? null
}

// Resolve o vendedor escolhido no formulário (id existente ou novo nome digitado).
async function resolveSellerFromForm(distributorId: string, formData: FormData): Promise<string | null> {
  const sellerNew = String(formData.get("sellerNew") || "").trim()
  if (sellerNew) return resolveSeller(distributorId, sellerNew)
  const sellerId = String(formData.get("sellerId") || "")
  if (!sellerId) return null
  const [s] = await db.select({ id: sellers.id }).from(sellers).where(and(eq(sellers.id, sellerId), eq(sellers.distributorId, distributorId)))
  return s?.id ?? null
}

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
  const sellerId = await resolveSellerFromForm(u.id, formData)

  if (id) {
    await db.update(companies).set({ ...f, sellerId }).where(and(eq(companies.id, id), eq(companies.distributorId, u.id)))
    // mantém o nome desnormalizado nos alunos já vinculados
    await db
      .update(students)
      .set({ empresa: f.nome })
      .where(and(eq(students.companyId, id), eq(students.distributorId, u.id)))
    revalidatePath("/parceiro365/empresas")
    revalidatePath("/parceiro365/alunos")
    return { ok: "Empresa atualizada." }
  }

  await db.insert(companies).values({ ...f, sellerId, distributorId: u.id })
  revalidatePath("/parceiro365/empresas")
  return { ok: "Empresa cadastrada." }
}

export async function assignSeller(formData: FormData): Promise<void> {
  const u = await requireUser()
  const companyId = String(formData.get("companyId") || "")
  if (!companyId) return
  const sellerIdRaw = String(formData.get("sellerId") || "")
  let sellerId: string | null = null
  if (sellerIdRaw) {
    const [s] = await db.select({ id: sellers.id }).from(sellers).where(and(eq(sellers.id, sellerIdRaw), eq(sellers.distributorId, u.id)))
    sellerId = s?.id ?? null
  }
  await db.update(companies).set({ sellerId }).where(and(eq(companies.id, companyId), eq(companies.distributorId, u.id)))
  revalidatePath("/parceiro365/empresas")
}

export async function updateSeller(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  const nome = String(formData.get("nome") || "").trim()
  if (!id || !nome) return
  await db.update(sellers).set({ nome }).where(and(eq(sellers.id, id), eq(sellers.distributorId, u.id)))
  revalidatePath("/parceiro365/empresas")
}

export async function deleteSeller(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return
  // FK companies.seller_id é ON DELETE set null — as empresas ficam sem vendedor.
  await db.delete(sellers).where(and(eq(sellers.id, id), eq(sellers.distributorId, u.id)))
  revalidatePath("/parceiro365/empresas")
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
