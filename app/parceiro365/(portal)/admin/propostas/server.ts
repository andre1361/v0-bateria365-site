import { and, eq, gt } from "drizzle-orm"
import { db } from "@/db"
import { flightSearchCache, proposalSettings } from "@/db/schema"
import { PADROES, type Configuracoes } from "@/lib/proposta/padroes"
import { buscarVoosSerpApi, chaveCache, type BuscaVoos, type ResultadoBusca } from "@/lib/proposta/serpapi"
import { mouraDirectory, type MouraEntry } from "../moura-directory"

const CACHE_MS = 6 * 60 * 60 * 1000

// Unidades da Rede Moura que podem receber proposta: matriz ou filial com e-mail
// (o e-mail vira o login da conta criada no aceite). Holding, fábrica e escritório ficam de fora.
export function unidadesMoura(): MouraEntry[] {
  return mouraDirectory.filter((e) => (e.tipo === "Matriz" || e.tipo === "Filial") && e.email.trim())
}

export function unidadeMoura(id: string): MouraEntry | undefined {
  return unidadesMoura().find((e) => e.id === id)
}

// Mesmo nome que o cadastro de distribuidor do Super Admin usa para a conta.
export const nomeUnidadeMoura = (e: MouraEntry) => e.razaoSocial || e.unidade
export const emailUnidadeMoura = (e: MouraEntry) => e.email.trim().toLowerCase()

export async function obterConfiguracoes(): Promise<Configuracoes> {
  const [s] = await db.select().from(proposalSettings).where(eq(proposalSettings.id, "padrao"))
  if (!s) return PADROES
  return {
    parametros: {
      hotelDiaria: s.hotelDiaria,
      alimentacaoDia: s.alimentacaoDia,
      uberFixo: s.uberFixo,
      honorario: s.honorario,
      acrescimoPct: s.acrescimoPct,
    },
    validadeDias: s.validadeDias,
    visitasTecnicas: s.visitasTecnicas,
  }
}

// Reaproveita a busca da mesma rota e datas por 6h para não gastar crédito da SerpApi.
// Só respostas com voos entram no cache.
export async function buscarVoosComCache(b: BuscaVoos, forcar: boolean): Promise<ResultadoBusca> {
  const chave = chaveCache(b)
  if (!forcar) {
    const [c] = await db
      .select()
      .from(flightSearchCache)
      .where(and(eq(flightSearchCache.chave, chave), gt(flightSearchCache.buscadoEm, new Date(Date.now() - CACHE_MS))))
    if (c) return { ok: true, opcoes: c.resultados, doCache: true }
  }
  const r = await buscarVoosSerpApi(b, process.env.SERPAPI_API_KEY)
  if (r.ok) {
    const agora = new Date()
    await db
      .insert(flightSearchCache)
      .values({ chave, resultados: r.opcoes, buscadoEm: agora })
      .onConflictDoUpdate({ target: flightSearchCache.chave, set: { resultados: r.opcoes, buscadoEm: agora } })
  }
  return r
}
