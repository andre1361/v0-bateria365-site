"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, invites } from "@/db/schema"
import { requireUser } from "../../guard"

export type InviteLog = {
  template: string
  cidade: string
  data: string
  horario: string
  distribuidor: string
  local: string
}

export async function logInvite(meta: InviteLog): Promise<void> {
  const u = await requireUser()
  await db.insert(invites).values({
    distributorId: u.id,
    template: meta.template || "",
    cidade: meta.cidade || "",
    data: meta.data || "",
    horario: meta.horario || "",
    distribuidorNome: meta.distribuidor || "",
    local: meta.local || "",
  })
}

export type SavePhotoResult = { ok?: boolean; error?: string }

// Salva, no treinamento, a foto de fundo e a arte montada do convite escolhidas
// na Arte do convite. A foto (fundoUrl) alimenta a arte ao vivo na página; a arte
// montada (arteUrl) é a imagem de prévia ao compartilhar (og:image).
export async function saveInvitePhoto(eventId: string, fundoUrl: string, arteUrl = ""): Promise<SavePhotoResult> {
  const u = await requireUser()
  if (!eventId) return { error: "Escolha um treinamento para salvar a foto." }
  const url = (fundoUrl || "").trim()
  // Só aceita URL hospedada (http/https) ou vazio (remover). Evita gravar base64 gigante no banco.
  if (url && !/^https?:\/\//i.test(url)) return { error: "Foto inválida. Envie a imagem novamente." }
  const arte = (arteUrl || "").trim()
  if (arte && !/^https?:\/\//i.test(arte)) return { error: "Arte inválida. Tente novamente." }
  const res = await db
    .update(events)
    // arteUrl só é sobrescrita quando veio uma nova (evita apagar a existente se a captura falhar).
    .set({ fundoUrl: url, ...(arte ? { arteUrl: arte } : {}) })
    .where(and(eq(events.id, eventId), eq(events.distributorId, u.id)))
    .returning({ id: events.id })
  if (res.length === 0) return { error: "Treinamento não encontrado." }
  revalidatePath("/parceiro365/convites")
  return { ok: true }
}
