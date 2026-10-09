// Busca de passagens de ida e volta na SerpApi (Google Flights). A resposta lista
// as opções de IDA já com o preço TOTAL da viagem; os horários da volta exigiriam
// uma consulta extra por opção e ficam de fora.

export type OpcaoVoo = {
  preco: number // centavos, ida e volta
  companhia: string
  partida: string // "AAAA-MM-DD HH:MM" da ida
  chegada: string
  duracaoMin: number
  escalas: number
}

export type BuscaVoos = { origem: string; destino: string; idaISO: string; voltaISO: string }

export type ResultadoBusca =
  | { ok: true; opcoes: OpcaoVoo[]; doCache?: boolean; local?: boolean }
  | { ok: false; erro: string }

export const MSG_VOOS = {
  semChave: "Busca de voos não configurada — use o valor manual.",
  chaveInvalida: "Chave da SerpApi inválida — confira a configuração ou use o valor manual.",
  semCredito: "Créditos da SerpApi esgotados — use o valor manual.",
  semVoos: "Nenhum voo encontrado nessas datas.",
  falha: "Não foi possível buscar os voos agora — tente de novo ou use o valor manual.",
}

const MAX_OPCOES = 5

export function urlBusca(b: BuscaVoos, apiKey: string): string {
  const p = new URLSearchParams({
    engine: "google_flights",
    departure_id: b.origem,
    arrival_id: b.destino,
    outbound_date: b.idaISO,
    return_date: b.voltaISO,
    type: "1",
    currency: "BRL",
    hl: "pt-br",
    gl: "br",
    adults: "1",
    api_key: apiKey,
  })
  return `https://serpapi.com/search.json?${p}`
}

export function chaveCache(b: BuscaVoos): string {
  return `${b.origem}-${b.destino}-${b.idaISO}-${b.voltaISO}`
}

type Trecho = { departure_airport?: { time?: string }; arrival_airport?: { time?: string }; airline?: string }
type Itinerario = { flights?: Trecho[]; price?: number; total_duration?: number }

function erroDaConta(msg: string): string {
  if (/hasn't returned any results|no results/i.test(msg)) return MSG_VOOS.semVoos
  if (/run out of searches/i.test(msg)) return MSG_VOOS.semCredito
  if (/invalid api key/i.test(msg)) return MSG_VOOS.chaveInvalida
  return MSG_VOOS.falha
}

export function normalizarResposta(json: unknown): ResultadoBusca {
  const j = (json ?? {}) as { error?: string; best_flights?: Itinerario[]; other_flights?: Itinerario[] }
  const lista = [...(j.best_flights ?? []), ...(j.other_flights ?? [])]
  const opcoes = lista
    .flatMap((it): OpcaoVoo[] => {
      const trechos = it.flights ?? []
      if (typeof it.price !== "number" || it.price <= 0 || trechos.length === 0) return []
      const companhias = [...new Set(trechos.map((t) => t.airline).filter((x): x is string => !!x))]
      return [
        {
          preco: Math.round(it.price * 100),
          companhia: companhias.join(" + ") || "—",
          partida: trechos[0].departure_airport?.time ?? "",
          chegada: trechos[trechos.length - 1].arrival_airport?.time ?? "",
          duracaoMin: it.total_duration ?? 0,
          escalas: trechos.length - 1,
        },
      ]
    })
    .sort((x, y) => x.preco - y.preco)
    .slice(0, MAX_OPCOES)

  if (opcoes.length) return { ok: true, opcoes }
  if (j.error) return { ok: false, erro: erroDaConta(j.error) }
  return { ok: false, erro: MSG_VOOS.semVoos }
}

export async function buscarVoosSerpApi(
  b: BuscaVoos,
  apiKey: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoBusca> {
  if (!apiKey) return { ok: false, erro: MSG_VOOS.semChave }
  try {
    const r = await fetchFn(urlBusca(b, apiKey), { cache: "no-store", signal: AbortSignal.timeout(20000) })
    const json = (await r.json().catch(() => null)) as { error?: string } | null
    if (!r.ok && !json?.error) return { ok: false, erro: MSG_VOOS.falha }
    return normalizarResposta(json)
  } catch {
    return { ok: false, erro: MSG_VOOS.falha }
  }
}
