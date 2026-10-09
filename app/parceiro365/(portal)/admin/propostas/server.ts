import { and, eq, gt } from "drizzle-orm"
import { db } from "@/db"
import { flightSearchCache, proposalSettings } from "@/db/schema"
import type { Parametros } from "@/lib/proposta/calculo"
import { PADROES } from "@/lib/proposta/padroes"
import { buscarVoosSerpApi, chaveCache, type BuscaVoos, type ResultadoBusca } from "@/lib/proposta/serpapi"

const CACHE_MS = 6 * 60 * 60 * 1000

export async function obterConfiguracoes(): Promise<{ parametros: Parametros; validadeDias: number }> {
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
