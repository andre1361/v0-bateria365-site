"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events } from "@/db/schema"
import { requireUser } from "../../guard"

export type EventState = { error?: string; ok?: string }

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function readFields(formData: FormData) {
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

export async function saveEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  const f = readFields(formData)
  if (!f.titulo) return { error: "Informe o título do evento." }

  if (id) {
    await db
      .update(events)
      .set(f)
      .where(and(eq(events.id, id), eq(events.distributorId, u.id)))
    revalidatePath("/parceiro365/eventos")
    return { ok: "Evento atualizado." }
  }

  const slug = (slugify(`${f.cidade}-${f.titulo}`) || "evento") + "-" + randomUUID().replace(/-/g, "").slice(0, 6)
  await db.insert(events).values({ ...f, distributorId: u.id, slug })
  revalidatePath("/parceiro365/eventos")
  return { ok: "Evento criado." }
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return
  await db.delete(events).where(and(eq(events.id, id), eq(events.distributorId, u.id)))
  revalidatePath("/parceiro365/eventos")
}
