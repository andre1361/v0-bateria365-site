import { describe, expect, test } from "bun:test"
import fixture from "./fixtures/serpapi-poa-ssa.json"
import { MSG_VOOS, buscarVoosSerpApi, chaveCache, normalizarResposta, urlBusca, type BuscaVoos } from "./serpapi"

const busca: BuscaVoos = { origem: "POA", destino: "SSA", idaISO: "2026-10-13", voltaISO: "2026-10-15" }

describe("urlBusca e chaveCache", () => {
  test("monta a busca de ida e volta em reais", () => {
    const u = new URL(urlBusca(busca, "k123"))
    expect(u.origin + u.pathname).toBe("https://serpapi.com/search.json")
    expect(Object.fromEntries(u.searchParams)).toEqual({
      engine: "google_flights",
      departure_id: "POA",
      arrival_id: "SSA",
      outbound_date: "2026-10-13",
      return_date: "2026-10-15",
      type: "1",
      currency: "BRL",
      hl: "pt-br",
      gl: "br",
      adults: "1",
      api_key: "k123",
    })
  })
  test("chave do cache identifica rota e datas", () => {
    expect(chaveCache(busca)).toBe("POA-SSA-2026-10-13-2026-10-15")
  })
})

describe("normalizarResposta", () => {
  test("junta best e other, descarta sem preço ou sem trecho, ordena e limita a 5", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes.map((o) => o.preco)).toEqual([138900, 152300, 174500, 189000, 210000])
  })
  test("voo direto: companhia, horários, duração e zero escalas", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes[0]).toEqual({
      preco: 138900,
      companhia: "GOL",
      partida: "2026-10-13 10:20",
      chegada: "2026-10-13 13:30",
      duracaoMin: 190,
      escalas: 0,
    })
  })
  test("conexão com duas companhias", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes[4]).toMatchObject({ companhia: "GOL + LATAM", escalas: 1, chegada: "2026-10-13 11:15" })
  })
  test("só other_flights também funciona", () => {
    const r = normalizarResposta({ other_flights: fixture.other_flights })
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes.map((o) => o.preco)).toEqual([174500, 189000, 210000, 245000])
  })
  test("sem resultados → mensagem de nenhum voo", () => {
    expect(normalizarResposta({ error: "Google Flights hasn't returned any results for this query." })).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
    expect(normalizarResposta({ best_flights: [] })).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
    expect(normalizarResposta(null)).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
  })
  test("erros de conta viram mensagens claras", () => {
    expect(normalizarResposta({ error: "Your account has run out of searches." })).toEqual({ ok: false, erro: MSG_VOOS.semCredito })
    expect(normalizarResposta({ error: "Invalid API key. Your API key should be here: ..." })).toEqual({ ok: false, erro: MSG_VOOS.chaveInvalida })
    expect(normalizarResposta({ error: "Something else" })).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
})

describe("buscarVoosSerpApi", () => {
  const resposta = (status: number, corpo: unknown) =>
    (async () => new Response(JSON.stringify(corpo), { status })) as unknown as typeof fetch

  test("sem chave nem chama a rede", async () => {
    let chamou = false
    const f = (async () => {
      chamou = true
      return new Response("{}")
    }) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, undefined, f)).toEqual({ ok: false, erro: MSG_VOOS.semChave })
    expect(chamou).toBe(false)
  })
  test("resposta boa → opções", async () => {
    const r = await buscarVoosSerpApi(busca, "k", resposta(200, fixture))
    expect(r.ok && r.opcoes.length).toBe(5)
  })
  test("401 com erro de chave → chave inválida", async () => {
    expect(await buscarVoosSerpApi(busca, "k", resposta(401, { error: "Invalid API key." }))).toEqual({ ok: false, erro: MSG_VOOS.chaveInvalida })
  })
  test("500 sem corpo JSON → falha genérica", async () => {
    const f = (async () => new Response("<html>erro</html>", { status: 500 })) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, "k", f)).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
  test("exceção de rede → falha genérica", async () => {
    const f = (async () => {
      throw new Error("offline")
    }) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, "k", f)).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
})
