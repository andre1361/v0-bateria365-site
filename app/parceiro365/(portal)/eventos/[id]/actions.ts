"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events } from "@/db/schema"
import { requireUser } from "../../../guard"

export type TrainingEditState = { error?: string; ok?: string }

// O distribuidor pode ajustar apenas data, horário e local do PRÓPRIO treinamento.
export async function updateTrainingBasics(_prev: TrainingEditState, formData: FormData): Promise<TrainingEditState> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return { error: "Treinamento inválido." }

  const dataISO = String(formData.get("dataISO") || "").trim()
  const horario = String(formData.get("horario") || "").trim()
  const local = String(formData.get("local") || "").trim()

  await db
    .update(events)
    .set({ dataISO, horario, local })
    .where(and(eq(events.id, id), eq(events.distributorId, u.id)))

  revalidatePath(`/parceiro365/eventos/${id}`)
  revalidatePath("/parceiro365/eventos")
  return { ok: "Dados atualizados." }
}
