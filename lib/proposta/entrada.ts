import { aeroportoPorIata } from "./aeroportos"
import type { Parametros, VooEscolhido, Voos } from "./calculo"
import { isoValida, somarDiasISO } from "./formato"
import { ORIGENS } from "./origens"

// Valida o que chega do editor do admin. Nada do navegador é confiável: valores
// fora de faixa são recusados e campos desconhecidos são descartados.

export type EntradaProposta = {
  distributorId: string
  destinoIata: string
  dataInicioISO: string
  duracaoDias: number
  parametros: Parametros
  validadeDias: number
  voos: Voos
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_VALOR = 100_000_000 // R$ 1 milhão
const MAX_PASSAGEM = 10_000_000 // R$ 100 mil

const inteiro = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null
const texto = (v: unknown, max: number): string | undefined => (typeof v === "string" ? v.trim().slice(0, max) : undefined)

function lerVoo(raw: unknown): VooEscolhido | null | "invalido" {
  if (raw == null) return null
  if (typeof raw !== "object") return "invalido"
  const r = raw as Record<string, unknown>
  if (r.modo !== "serpapi" && r.modo !== "manual" && r.modo !== "local") return "invalido"
  const preco = inteiro(r.preco, 0, MAX_PASSAGEM)
  if (preco === null) return "invalido"
  const voo: VooEscolhido = { modo: r.modo, preco }
  if (r.modo === "serpapi") {
    voo.companhia = texto(r.companhia, 80)
    voo.partida = texto(r.partida, 20)
    voo.chegada = texto(r.chegada, 20)
    voo.duracaoMin = inteiro(r.duracaoMin, 0, 10000) ?? undefined
    voo.escalas = inteiro(r.escalas, 0, 10) ?? undefined
  }
  return voo
}

export function validarEntrada(
  raw: unknown,
  hojeISO: string,
  exigirCompleta: boolean,
): { ok: true; valor: EntradaProposta } | { ok: false; erro: string } {
  if (!raw || typeof raw !== "object") return { ok: false, erro: "Dados inválidos." }
  const r = raw as Record<string, unknown>

  const distributorId = typeof r.distributorId === "string" ? r.distributorId : ""
  if (!UUID_RE.test(distributorId)) return { ok: false, erro: "Escolha o distribuidor." }

  const destinoIata = typeof r.destinoIata === "string" ? r.destinoIata.trim().toUpperCase() : ""
  if (destinoIata && !aeroportoPorIata(destinoIata)) return { ok: false, erro: "Aeroporto de destino inválido." }

  const dataInicioISO = typeof r.dataInicioISO === "string" ? r.dataInicioISO.trim() : ""
  if (dataInicioISO && !isoValida(dataInicioISO)) return { ok: false, erro: "Data do treinamento inválida." }

  const duracaoDias = inteiro(r.duracaoDias, 1, 10)
  if (duracaoDias === null) return { ok: false, erro: "A duração deve ser de 1 a 10 dias." }

  const validadeDias = inteiro(r.validadeDias, 1, 60)
  if (validadeDias === null) return { ok: false, erro: "A validade deve ser de 1 a 60 dias." }

  const p = (r.parametros ?? {}) as Record<string, unknown>
  const lidos = {
    hotelDiaria: inteiro(p.hotelDiaria, 0, MAX_VALOR),
    alimentacaoDia: inteiro(p.alimentacaoDia, 0, MAX_VALOR),
    uberFixo: inteiro(p.uberFixo, 0, MAX_VALOR),
    honorario: inteiro(p.honorario, 0, MAX_VALOR),
    acrescimoPct: inteiro(p.acrescimoPct, 0, 10000),
  }
  if (Object.values(lidos).some((v) => v === null)) return { ok: false, erro: "Revise os valores de custo." }
  const parametros = lidos as Parametros

  const brutos = (r.voos ?? {}) as Record<string, unknown>
  const voos: Voos = {}
  for (const o of ORIGENS) {
    const v = lerVoo(brutos[o.id])
    if (v === "invalido") return { ok: false, erro: `Voo de ${o.cidade} inválido.` }
    if (o.iata === destinoIata) voos[o.id] = { modo: "local", preco: 0 }
    else if (v && v.modo !== "local") voos[o.id] = v
  }

  if (exigirCompleta) {
    if (!destinoIata) return { ok: false, erro: "Escolha o aeroporto de destino." }
    if (!dataInicioISO) return { ok: false, erro: "Informe a data do treinamento." }
    if (dataInicioISO < somarDiasISO(hojeISO, 1)) {
      return { ok: false, erro: "O treinamento precisa começar a partir de amanhã (a ida é no dia anterior)." }
    }
    for (const o of ORIGENS) {
      const voo = voos[o.id]
      if (!voo || (voo.modo !== "local" && voo.preco <= 0)) {
        return { ok: false, erro: `Escolha o voo (ou informe o valor) de ${o.cidade}.` }
      }
    }
  }

  return { ok: true, valor: { distributorId, destinoIata, dataInicioISO, duracaoDias, parametros, validadeDias, voos } }
}
