"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, rsvps, students } from "@/db/schema"

export type RsvpState = { ok?: boolean; error?: string }

// Ação pública (sem auth) — confirma presença e cadastra a pessoa como aluno
// do distribuidor do evento (sem duplicar).
export async function confirmAttendance(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const slug = String(formData.get("slug") || "")
  const nome = String(formData.get("nome") || "").trim()
  const telefone = String(formData.get("telefone") || "").trim()
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
  const empresa = String(formData.get("empresa") || "").trim()

  if (!nome) return { error: "Informe seu nome." }
  if (telefone.replace(/\D/g, "").length < 8) return { error: "Informe um WhatsApp válido." }

  const ev = (
    await db
      .select({ id: events.id, distributorId: events.distributorId })
      .from(events)
      .where(and(eq(events.slug, slug), eq(events.ativo, true)))
  )[0]
  if (!ev) return { error: "Convite inválido ou desativado." }

  await db.insert(rsvps).values({ eventId: ev.id, nome, telefone, email, empresa })

  // cadastra como aluno do distribuidor (evita duplicar por e-mail ou nome)
  try {
    const existentes = await db
      .select({ nome: students.nome, email: students.email })
      .from(students)
      .where(eq(students.distributorId, ev.distributorId))
    const jaExiste = existentes.some((s) =>
      email ? s.email.trim().toLowerCase() === email : s.nome.trim().toLowerCase() === nome.toLowerCase(),
    )
    if (!jaExiste) {
      await db.insert(students).values({ distributorId: ev.distributorId, nome, email, telefone, empresa })
    }
  } catch {
    /* não bloqueia a confirmação */
  }

  return { ok: true }
}
