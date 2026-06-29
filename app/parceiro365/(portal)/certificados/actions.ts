"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { certificates, emitLinks } from "@/db/schema"
import { requireUser } from "../../guard"

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function logCertificates(items: { nome: string; empresa?: string; data?: string }[]): Promise<void> {
  const u = await requireUser()
  const valid = (items || []).filter((i) => i?.nome?.trim())
  if (!valid.length) return
  await db.insert(certificates).values(
    valid.map((i) => ({
      distributorId: u.id,
      alunoNome: i.nome.trim(),
      empresa: (i.empresa || "").trim(),
      dataTreino: (i.data || "").trim(),
    })),
  )
  revalidatePath("/parceiro365")
}

export type LinkState = { ok?: string; error?: string; slug?: string }

export async function saveEmitLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const u = await requireUser()
  const senha = String(formData.get("senha") || "").trim()
  if (senha.length < 3) return { error: "A senha deve ter ao menos 3 caracteres." }

  const slug = (slugify(u.cidade || u.nome) || "parceiro") + "-" + u.id.slice(0, 8)
  const senhaHash = await bcrypt.hash(senha, 10)

  const existing = await db.select({ id: emitLinks.id }).from(emitLinks).where(eq(emitLinks.distributorId, u.id))
  if (existing.length) {
    await db.update(emitLinks).set({ slug, senhaHash, ativo: true }).where(eq(emitLinks.distributorId, u.id))
  } else {
    await db.insert(emitLinks).values({ distributorId: u.id, slug, senhaHash, ativo: true })
  }
  revalidatePath("/parceiro365/certificados")
  return { ok: "Link de auto-emissão atualizado.", slug }
}
