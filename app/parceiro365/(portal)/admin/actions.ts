"use server"

import { revalidatePath } from "next/cache"
import { randomUUID, randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { users, events } from "@/db/schema"
import { requireAdmin } from "../../guard"

export type AdminState = { error?: string; ok?: string }
export type EventAdminState = { error?: string; ok?: string }

export async function createDistributor(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()
  const nome = String(formData.get("nome") || "").trim()
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
  const cidade = String(formData.get("cidade") || "").trim()
  const senha = String(formData.get("senha") || "")

  if (!nome || !email) return { error: "Informe nome e e-mail." }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "E-mail inválido." }
  if (senha.length < 6) return { error: "A senha deve ter ao menos 6 caracteres." }

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (exists.length) return { error: "Já existe um usuário com esse e-mail." }

  const passwordHash = await bcrypt.hash(senha, 10)
  await db.insert(users).values({ nome, email, cidade, passwordHash, senhaPlain: senha, role: "distribuidor" })
  revalidatePath("/parceiro365/admin")
  return { ok: `Distribuidor "${nome}" cadastrado.` }
}

export async function toggleDistributor(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get("id") || "")
  const ativo = String(formData.get("ativo") || "") === "true"
  if (!id) return
  await db
    .update(users)
    .set({ ativo: !ativo })
    .where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  revalidatePath("/parceiro365/admin")
}

export async function deleteDistributor(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get("id") || "")
  if (!id) return
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  revalidatePath("/parceiro365/admin")
}

// --- Treinamentos (eventos) criados pelo Super Admin e vinculados a um distribuidor ---

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function readEventFields(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") || "").trim(),
    modulo: String(formData.get("modulo") || "").trim(),
    dataISO: String(formData.get("dataISO") || "").trim(),
    horario: String(formData.get("horario") || "").trim(),
    cidade: String(formData.get("cidade") || "").trim(),
    local: String(formData.get("local") || "").trim(),
    responsavel: String(formData.get("responsavel") || "").trim(),
    instagram: String(formData.get("instagram") || "")
      .trim()
      .replace(/^@+/, ""),
    template: String(formData.get("template") || "square") === "vertical" ? "vertical" : "square",
  }
}

export async function saveEventForDistributor(_prev: EventAdminState, formData: FormData): Promise<EventAdminState> {
  await requireAdmin()
  const distributorId = String(formData.get("distributorId") || "")
  if (!distributorId) return { error: "Distribuidor inválido." }
  const [d] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, distributorId), eq(users.role, "distribuidor")))
  if (!d) return { error: "Distribuidor não encontrado." }

  const f = readEventFields(formData)
  if (!f.titulo) return { error: "Informe o título do treinamento." }

  const id = String(formData.get("id") || "")
  if (id) {
    await db.update(events).set(f).where(and(eq(events.id, id), eq(events.distributorId, distributorId)))
    revalidatePath(`/parceiro365/admin/${distributorId}`)
    return { ok: "Treinamento atualizado." }
  }

  const slug = (slugify(`${f.cidade}-${f.titulo}`) || "treino") + "-" + randomUUID().replace(/-/g, "").slice(0, 6)
  await db.insert(events).values({ ...f, distributorId, slug })
  revalidatePath(`/parceiro365/admin/${distributorId}`)
  return { ok: "Treinamento criado." }
}

export async function deleteEventForDistributor(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get("id") || "")
  const distributorId = String(formData.get("distributorId") || "")
  if (!id || !distributorId) return
  await db.delete(events).where(and(eq(events.id, id), eq(events.distributorId, distributorId)))
  revalidatePath(`/parceiro365/admin/${distributorId}`)
}

// --- Reenvio de dados de login do distribuidor (mensagem pronta p/ WhatsApp) ---

export type LoginData = { nome: string; email: string; senha: string | null } | { error: string }

// Senha legível, sem caracteres ambíguos, no formato ABCD-2345.
function gerarSenha() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const b = randomBytes(8)
  let s = ""
  for (let i = 0; i < 8; i++) s += abc[b[i] % abc.length]
  return s.slice(0, 4) + "-" + s.slice(4)
}

export async function getDistributorLogin(id: string): Promise<LoginData> {
  await requireAdmin()
  if (!id) return { error: "Distribuidor inválido." }
  const [d] = await db
    .select({ nome: users.nome, email: users.email, senhaPlain: users.senhaPlain })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  if (!d) return { error: "Distribuidor não encontrado." }
  return { nome: d.nome, email: d.email, senha: d.senhaPlain ?? null }
}

export async function resetDistributorPassword(id: string): Promise<LoginData> {
  await requireAdmin()
  if (!id) return { error: "Distribuidor inválido." }
  const [d] = await db
    .select({ nome: users.nome, email: users.email })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  if (!d) return { error: "Distribuidor não encontrado." }
  const senha = gerarSenha()
  const passwordHash = await bcrypt.hash(senha, 10)
  await db.update(users).set({ passwordHash, senhaPlain: senha }).where(and(eq(users.id, id), eq(users.role, "distribuidor")))
  revalidatePath("/parceiro365/admin")
  return { nome: d.nome, email: d.email, senha }
}
