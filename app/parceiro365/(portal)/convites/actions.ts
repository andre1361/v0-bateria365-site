"use server"

import { db } from "@/db"
import { invites } from "@/db/schema"
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
