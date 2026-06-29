"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { emitLinks, certificates } from "@/db/schema"
import { emitCookieName, emitToken } from "./emit-lib"

export type EmitState = { error?: string }

export async function verifyEmitPassword(_prev: EmitState, formData: FormData): Promise<EmitState> {
  const slug = String(formData.get("slug") || "")
  const senha = String(formData.get("senha") || "")
  const link = (
    await db.select().from(emitLinks).where(and(eq(emitLinks.slug, slug), eq(emitLinks.ativo, true)))
  )[0]
  if (!link) return { error: "Link inválido ou desativado." }

  const ok = await bcrypt.compare(senha, link.senhaHash)
  if (!ok) return { error: "Senha incorreta." }

  const c = await cookies()
  c.set(emitCookieName(slug), emitToken(link.senhaHash, slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/parceiro365/emitir/${slug}`,
    maxAge: 60 * 60 * 6,
  })
  redirect(`/parceiro365/emitir/${slug}`)
}

export async function logEmitCertificate(slug: string, nome: string, empresa: string): Promise<void> {
  if (!nome.trim()) return
  const link = (
    await db.select().from(emitLinks).where(and(eq(emitLinks.slug, slug), eq(emitLinks.ativo, true)))
  )[0]
  if (!link) return
  const c = await cookies()
  if (c.get(emitCookieName(slug))?.value !== emitToken(link.senhaHash, slug)) return
  await db.insert(certificates).values({
    distributorId: link.distributorId,
    alunoNome: nome.trim(),
    empresa: (empresa || "").trim(),
    dataTreino: "",
  })
}
