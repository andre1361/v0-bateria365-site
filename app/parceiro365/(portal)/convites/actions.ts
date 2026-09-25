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

// Salva a foto de fundo escolhida na Arte do convite direto no treinamento,
// para que o convite online (link enviado às empresas) passe a exibi-la.
export async function saveInvitePhoto(eventId: string, fundoUrl: string): Promise<SavePhotoResult> {
  const u = await requireUser()
  if (!eventId) return { error: "Escolha um treinamento para salvar a foto." }
  const url = (fundoUrl || "").trim()
  // Só aceita URL hospedada (http/https) ou vazio (remover). Evita gravar base64 gigante no banco.
  if (url && !/^https?:\/\//i.test(url)) return { error: "Foto inválida. Envie a imagem novamente." }
  const res = await db
    .update(events)
    .set({ fundoUrl: url })
    .where(and(eq(events.id, eventId), eq(events.distributorId, u.id)))
    .returning({ id: events.id })
  if (res.length === 0) return { error: "Treinamento não encontrado." }
  revalidatePath("/parceiro365/convites")
  return { ok: true }
}
