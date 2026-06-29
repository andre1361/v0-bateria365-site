"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, companies, rsvps, students } from "@/db/schema"

export type TeamState = { ok?: boolean; error?: string; added?: number; skipped?: number }

type Pessoa = { nome: string; telefone: string; email: string }

function norm(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

// Ação pública (sem auth) — a empresa cadastra sua equipe no evento.
export async function registerTeam(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const slug = String(formData.get("slug") || "")
  const companyId = String(formData.get("companyId") || "")

  let people: Pessoa[] = []
  try {
    const raw = JSON.parse(String(formData.get("people") || "[]"))
    if (Array.isArray(raw)) people = raw
  } catch {
    /* ignora */
  }
  people = people
    .map((p) => ({ nome: String(p?.nome || "").trim(), telefone: String(p?.telefone || "").trim(), email: String(p?.email || "").trim() }))
    .filter((p) => p.nome)
  if (!people.length) return { error: "Adicione pelo menos um funcionário." }

  const [ev] = await db
    .select({ id: events.id, distributorId: events.distributorId })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.ativo, true)))
  if (!ev) return { error: "Evento não encontrado ou desativado." }

  const [co] = await db
    .select({ id: companies.id, nome: companies.nome })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.distributorId, ev.distributorId)))
  if (!co) return { error: "Empresa não encontrada." }

  // Evita duplicar quem esta empresa já adicionou neste evento (por nome).
  const jaRsvp = await db.select({ nome: rsvps.nome, empresa: rsvps.empresa }).from(rsvps).where(eq(rsvps.eventId, ev.id))
  const jaNomes = new Set(jaRsvp.filter((r) => norm(r.empresa) === norm(co.nome)).map((r) => norm(r.nome)))

  const novos = people.filter((p) => !jaNomes.has(norm(p.nome)))
  const skipped = people.length - novos.length
  if (!novos.length) return { ok: true, added: 0, skipped }

  await db.insert(rsvps).values(novos.map((p) => ({ eventId: ev.id, nome: p.nome, telefone: p.telefone, email: p.email, empresa: co.nome })))

  // Vincula/atualiza como alunos do distribuidor, sem duplicar (por e-mail ou nome).
  try {
    const existentes = await db
      .select({ id: students.id, nome: students.nome, email: students.email })
      .from(students)
      .where(eq(students.distributorId, ev.distributorId))
    const byEmail = new Map(existentes.filter((s) => s.email).map((s) => [s.email.trim().toLowerCase(), s.id]))
    const byName = new Map(existentes.map((s) => [norm(s.nome), s.id]))
    const inserir: { distributorId: string; companyId: string; nome: string; telefone: string; email: string; empresa: string }[] = []
    for (const p of novos) {
      const id = (p.email && byEmail.get(p.email.toLowerCase())) || byName.get(norm(p.nome))
      if (id) {
        await db.update(students).set({ companyId: co.id, empresa: co.nome }).where(eq(students.id, id))
      } else {
        inserir.push({ distributorId: ev.distributorId, companyId: co.id, nome: p.nome, telefone: p.telefone, email: p.email, empresa: co.nome })
      }
    }
    if (inserir.length) await db.insert(students).values(inserir)
  } catch {
    /* não bloqueia o cadastro de presença */
  }

  revalidatePath("/parceiro365/empresas")
  revalidatePath("/parceiro365/alunos")
  revalidatePath("/parceiro365/eventos")
  return { ok: true, added: novos.length, skipped }
}
