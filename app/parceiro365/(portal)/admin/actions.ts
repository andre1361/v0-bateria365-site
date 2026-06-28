"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requireAdmin } from "../../guard"

export type AdminState = { error?: string; ok?: string }

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
  await db.insert(users).values({ nome, email, cidade, passwordHash, role: "distribuidor" })
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
