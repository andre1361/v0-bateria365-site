"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, gt, isNull, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { events, proposals } from "@/db/schema"
import { normalizarChave, propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { statusEfetivo } from "@/lib/proposta/status"
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
export async function aceitarProposta(slug: string, visto: string): Promise<{ error?: string }> {
  const [p] = await db.select().from(proposals).where(eq(proposals.slug, slug))
  if (!p || !p.chaveHash) return { error: "Proposta indisponível." }
  const c = await cookies()
  if (c.get(propostaCookieName(slug))?.value !== propostaToken(p.chaveHash, slug)) {
    return { error: "Sessão expirada — informe a chave de acesso novamente." }
  }

  // O aceite vale só para a versão que o distribuidor viu (updatedAt): se o admin
  // alterou a proposta nesse meio-tempo, a reserva não acontece.
  const vistoEm = new Date(visto)
  if (Number.isNaN(vistoEm.getTime())) return { error: "Proposta indisponível." }

  const [reservada] = await db
    .update(proposals)
    .set({ status: "aceita", aceitaEm: new Date(), updatedAt: new Date() })
    .where(
      and(eq(proposals.id, p.id), eq(proposals.status, "enviada"), gt(proposals.validaAte, sql`now()`), eq(proposals.updatedAt, vistoEm)),
    )
    .returning({ id: proposals.id, distributorId: proposals.distributorId, dataInicioISO: proposals.dataInicioISO, destinoCidade: proposals.destinoCidade })
  if (!reservada) {
    revalidatePath(caminho(slug))
    const [atual] = await db.select({ status: proposals.status, validaAte: proposals.validaAte }).from(proposals).where(eq(proposals.id, p.id))
    if (atual && statusEfetivo(atual.status, atual.validaAte) === "enviada") {
      return { error: "A proposta foi atualizada — revise os valores antes de aceitar." }
    }
    return { error: "Esta proposta não pode mais ser aceita." }
  }

  // O evento é criado uma única vez. Falha ao inserir: desfaz a reserva. Falha só ao
  // vincular: tenta de novo e, se persistir, mantém o aceite (o evento já existe).
  let eventoId: string | null = null
  try {
    const eventoSlug = (slugify(`${reservada.destinoCidade}-treinamento-bateria-365`) || "evento") + "-" + randomUUID().replace(/-/g, "").slice(0, 6)
    const [ev] = await db
      .insert(events)
      .values({ distributorId: reservada.distributorId, titulo: "Treinamento Bateria 365", dataISO: reservada.dataInicioISO, cidade: reservada.destinoCidade, slug: eventoSlug })
      .returning({ id: events.id })
    eventoId = ev.id
  } catch {
    try {
      await db
        .update(proposals)
        .set({ status: "enviada", aceitaEm: null, updatedAt: vistoEm })
        .where(and(eq(proposals.id, p.id), eq(proposals.status, "aceita"), isNull(proposals.eventId)))
    } catch {}
    return { error: "Não foi possível concluir o aceite — tente de novo." }
  }
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      await db.update(proposals).set({ eventId: eventoId }).where(eq(proposals.id, p.id))
      break
    } catch {}
  }

  revalidatePath(caminho(slug))
  revalidatePath("/parceiro365/admin/propostas")
  revalidatePath("/parceiro365/eventos")
  return {}
}
