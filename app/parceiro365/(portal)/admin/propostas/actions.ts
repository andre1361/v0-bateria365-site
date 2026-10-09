"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, ne } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { proposalSettings, proposals, users } from "@/db/schema"
import { aeroportoPorIata } from "@/lib/proposta/aeroportos"
import { calcularProposta, datasViagem } from "@/lib/proposta/calculo"
import { gerarChave } from "@/lib/proposta/chave"
import { UUID_RE, validarEntrada, type EntradaProposta } from "@/lib/proposta/entrada"
import { dataISONoBrasil, isoValida, parseBRL, parsePercentual } from "@/lib/proposta/formato"
import { ORIGENS, type OrigemId } from "@/lib/proposta/origens"
import type { ResultadoBusca } from "@/lib/proposta/serpapi"
import { calcularValidade, podeEditar, statusEfetivo } from "@/lib/proposta/status"
import { slugify } from "@/lib/slug"
import { requireAdmin } from "../../../guard"
import { buscarVoosComCache } from "./server"

const LISTA = "/parceiro365/admin/propostas"

// Grava rascunho/alterações. O total é sempre recalculado aqui, nunca vem do navegador.
async function gravar(id: string | null, e: EntradaProposta): Promise<{ error?: string; id?: string }> {
  if (id && !UUID_RE.test(id)) return { error: "Proposta não encontrada." }
  const [dist] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, e.distributorId), eq(users.role, "distribuidor")))
  if (!dist) return { error: "Distribuidor não encontrado." }

  if (id) {
    const [atual] = await db
      .select({ status: proposals.status, validaAte: proposals.validaAte })
      .from(proposals)
      .where(eq(proposals.id, id))
    if (!atual) return { error: "Proposta não encontrada." }
    if (!podeEditar(statusEfetivo(atual.status, atual.validaAte))) return { error: "Esta proposta não pode mais ser editada." }
  }

  const datas = e.dataInicioISO ? datasViagem(e.dataInicioISO, e.duracaoDias) : { idaISO: "", voltaISO: "" }
  const valores = {
    distributorId: e.distributorId,
    destinoIata: e.destinoIata,
    destinoCidade: aeroportoPorIata(e.destinoIata)?.cidade ?? "",
    dataInicioISO: e.dataInicioISO,
    duracaoDias: e.duracaoDias,
    idaISO: datas.idaISO,
    voltaISO: datas.voltaISO,
    parametros: e.parametros,
    validadeDias: e.validadeDias,
    voos: e.voos,
    total: calcularProposta(e).total,
    updatedAt: new Date(),
  }

  if (id) {
    await db.update(proposals).set(valores).where(eq(proposals.id, id))
    return { id }
  }
  const [novo] = await db.insert(proposals).values(valores).returning({ id: proposals.id })
  return { id: novo.id }
}

export async function salvarProposta(id: string | null, raw: unknown): Promise<{ error?: string; id?: string }> {
  await requireAdmin()
  const v = validarEntrada(raw, dataISONoBrasil(new Date()), false)
  if (!v.ok) return { error: v.erro }
  const r = await gravar(id, v.valor)
  revalidatePath(LISTA)
  return r
}

// Envia (ou renova) a proposta: mesmo slug e mesma chave, nova validade.
export async function gerarLink(
  id: string | null,
  raw: unknown,
): Promise<{ error?: string; id?: string; slug?: string; chave?: string; validaAte?: string }> {
  await requireAdmin()
  const v = validarEntrada(raw, dataISONoBrasil(new Date()), true)
  if (!v.ok) return { error: v.erro }
  const g = await gravar(id, v.valor)
  if (g.error || !g.id) return g

  const [p] = await db
    .select({ slug: proposals.slug, chavePlain: proposals.chavePlain, chaveHash: proposals.chaveHash, destinoCidade: proposals.destinoCidade })
    .from(proposals)
    .where(eq(proposals.id, g.id))
  const slug =
    p.slug ?? `${slugify(`${p.destinoCidade}-treinamento`) || "treinamento"}-${randomUUID().replace(/-/g, "").slice(0, 6)}`
  const chave = p.chavePlain ?? gerarChave()
  const chaveHash = p.chaveHash ?? (await bcrypt.hash(chave, 10))
  const agora = new Date()
  const validaAte = calcularValidade(agora, v.valor.validadeDias)

  await db
    .update(proposals)
    .set({ slug, chavePlain: chave, chaveHash, status: "enviada", enviadaEm: agora, validaAte, updatedAt: agora })
    .where(eq(proposals.id, g.id))

  revalidatePath(LISTA)
  revalidatePath(`/parceiro365/proposta/${slug}`)
  return { id: g.id, slug, chave, validaAte: validaAte.toISOString() }
}

export async function cancelarProposta(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  if (!UUID_RE.test(id)) return { error: "Proposta não encontrada." }
  const [p] = await db
    .update(proposals)
    .set({ status: "cancelada", updatedAt: new Date() })
    .where(and(eq(proposals.id, id), ne(proposals.status, "aceita")))
    .returning({ id: proposals.id, slug: proposals.slug })
  if (!p) return { error: "Proposta aceita não pode ser cancelada." }
  revalidatePath(LISTA)
  if (p.slug) revalidatePath(`/parceiro365/proposta/${p.slug}`)
  return {}
}

export async function buscarVoos(
  destinoIata: string,
  dataInicioISO: string,
  duracaoDias: number,
  forcar: boolean,
): Promise<{ error?: string; resultados?: Record<OrigemId, ResultadoBusca> }> {
  await requireAdmin()
  if (!aeroportoPorIata(destinoIata)) return { error: "Escolha o aeroporto de destino." }
  if (!isoValida(dataInicioISO)) return { error: "Informe a data do treinamento." }
  if (!Number.isInteger(duracaoDias) || duracaoDias < 1 || duracaoDias > 10) return { error: "A duração deve ser de 1 a 10 dias." }
  const { idaISO, voltaISO } = datasViagem(dataInicioISO, duracaoDias)
  if (idaISO < dataISONoBrasil(new Date())) return { error: "A data da ida já passou." }

  const pares = await Promise.all(
    ORIGENS.map(async (o) => {
      const r: ResultadoBusca =
        o.iata === destinoIata
          ? { ok: true, opcoes: [], local: true }
          : await buscarVoosComCache({ origem: o.iata, destino: destinoIata, idaISO, voltaISO }, forcar)
      return [o.id, r] as const
    }),
  )
  return { resultados: Object.fromEntries(pares) as Record<OrigemId, ResultadoBusca> }
}

export type ConfigState = { error?: string; ok?: string }

export async function salvarConfiguracoes(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireAdmin()
  const dinheiro = (k: string) => parseBRL(String(formData.get(k) ?? ""))
  const hotelDiaria = dinheiro("hotelDiaria")
  const alimentacaoDia = dinheiro("alimentacaoDia")
  const uberFixo = dinheiro("uberFixo")
  const honorario = dinheiro("honorario")
  const acrescimoPct = parsePercentual(String(formData.get("acrescimoPct") ?? ""))
  const validadeDias = Number(formData.get("validadeDias"))
  if (hotelDiaria === null || alimentacaoDia === null || uberFixo === null || honorario === null || acrescimoPct === null) {
    return { error: "Revise os valores — use o formato 1.500,00 (e 6,5 no acréscimo)." }
  }
  if (!Number.isInteger(validadeDias) || validadeDias < 1 || validadeDias > 60) return { error: "A validade deve ser de 1 a 60 dias." }

  const valores = { hotelDiaria, alimentacaoDia, uberFixo, honorario, acrescimoPct, validadeDias, updatedAt: new Date() }
  await db
    .insert(proposalSettings)
    .values({ id: "padrao", ...valores })
    .onConflictDoUpdate({ target: proposalSettings.id, set: valores })
  revalidatePath(`${LISTA}/configuracoes`)
  return { ok: "Padrões salvos. Valem para as próximas propostas." }
}
