"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { raffles } from "@/db/schema"
import { requireUser } from "../../guard"

export async function saveRaffle(data: {
  participantes: string[]
  ganhadores: string[]
  semRepeticao: boolean
}): Promise<{ ok: boolean }> {
  const u = await requireUser()
  if (!data.ganhadores?.length) return { ok: false }
  await db.insert(raffles).values({
    distributorId: u.id,
    titulo: "",
    participantes: Array.isArray(data.participantes) ? data.participantes : [],
    ganhadores: Array.isArray(data.ganhadores) ? data.ganhadores : [],
    semRepeticao: !!data.semRepeticao,
  })
  revalidatePath("/parceiro365/sorteios")
  return { ok: true }
}
