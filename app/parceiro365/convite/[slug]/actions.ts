"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, rsvps } from "@/db/schema"

export type RsvpState = { ok?: boolean; error?: string }

// Ação pública (sem auth) — confirma presença num evento pelo slug.
export async function confirmAttendance(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const slug = String(formData.get("slug") || "")
  const nome = String(formData.get("nome") || "").trim()
  const telefone = String(formData.get("telefone") || "").trim()
  if (!nome) return { error: "Informe seu nome." }
  if (telefone.replace(/\D/g, "").length < 8) return { error: "Informe um WhatsApp válido." }

  const ev = (
    await db.select({ id: events.id }).from(events).where(and(eq(events.slug, slug), eq(events.ativo, true)))
  )[0]
  if (!ev) return { error: "Convite inválido ou desativado." }

  await db.insert(rsvps).values({ eventId: ev.id, nome, telefone })
  return { ok: true }
}
