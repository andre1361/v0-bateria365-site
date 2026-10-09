"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, gt, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { events, proposals } from "@/db/schema"
import { normalizarChave, propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { slugify } from "@/lib/slug"

export type ChaveState = { error?: string }

const caminho = (slug: string) => `/parceiro365/proposta/${slug}`

export async function verificarChave(_prev: ChaveState, formData: FormData): Promise<ChaveState> {
  const slug = String(formData.get("slug") || "")
  const chave = normalizarChave(String(formData.get("chave") || ""))
  const [p] = await db.select({ chaveHash: proposals.chaveHash, status: proposals.status }).from(proposals).where(eq(proposals.slug, slug))
  if (!p || !p.chaveHash || p.status === "rascunho" || p.status === "cancelada") return { error: "Proposta indisponível." }

  const ok = await bcrypt.compare(chave, p.chaveHash)
  if (!ok) return { error: "Chave incorreta." }

  const c = await cookies()
  c.set(propostaCookieName(slug), propostaToken(p.chaveHash, slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: caminho(slug),
    maxAge: 60 * 60 * 6,
  })
  redirect(caminho(slug))
}

// Sem transação no driver neon-http: a proposta é "reservada" com um UPDATE
// condicional antes de criar o evento, e a reserva é desfeita se o evento falhar.
export async function aceitarProposta(slug: string): Promise<{ error?: string }> {
  const [p] = await db.select().from(proposals).where(eq(proposals.slug, slug))
  if (!p || !p.chaveHash) return { error: "Proposta indisponível." }
  const c = await cookies()
  if (c.get(propostaCookieName(slug))?.value !== propostaToken(p.chaveHash, slug)) {
    return { error: "Sessão expirada — informe a chave de acesso novamente." }
  }

  const [reservada] = await db
    .update(proposals)
    .set({ status: "aceita", aceitaEm: new Date(), updatedAt: new Date() })
    .where(and(eq(proposals.id, p.id), eq(proposals.status, "enviada"), gt(proposals.validaAte, sql`now()`)))
    .returning({ id: proposals.id })
  if (!reservada) {
    revalidatePath(caminho(slug))
    return { error: "Esta proposta não pode mais ser aceita." }
  }

  try {
    const eventoSlug = (slugify(`${p.destinoCidade}-treinamento-bateria-365`) || "evento") + "-" + randomUUID().replace(/-/g, "").slice(0, 6)
    const [ev] = await db
      .insert(events)
      .values({ distributorId: p.distributorId, titulo: "Treinamento Bateria 365", dataISO: p.dataInicioISO, cidade: p.destinoCidade, slug: eventoSlug })
      .returning({ id: events.id })
    await db.update(proposals).set({ eventId: ev.id }).where(eq(proposals.id, p.id))
  } catch {
    await db.update(proposals).set({ status: "enviada", aceitaEm: null, updatedAt: new Date() }).where(eq(proposals.id, p.id))
    return { error: "Não foi possível concluir o aceite — tente de novo." }
  }

  revalidatePath(caminho(slug))
  revalidatePath("/parceiro365/admin/propostas")
  revalidatePath("/parceiro365/eventos")
  return {}
}
