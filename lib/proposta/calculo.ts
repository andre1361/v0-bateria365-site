import { somarDiasISO } from "./formato"
import { ORIGENS, PESSOAS, type OrigemId } from "./origens"

// Valores em centavos; acrescimoPct em centésimos de % (650 = 6,5%).
export type Parametros = {
  hotelDiaria: number
  alimentacaoDia: number
  uberFixo: number
  honorario: number
  acrescimoPct: number
}

export type VooEscolhido = {
  modo: "serpapi" | "manual" | "local"
  preco: number
  companhia?: string
  partida?: string
  chegada?: string
  duracaoMin?: number
  escalas?: number
}

export type Voos = Partial<Record<OrigemId, VooEscolhido>>

export type Calculo = {
  passagens: Record<OrigemId, number | null>
  totalPassagens: number
  diarias: number
  diasAlimentacao: number
  hotel: number
  alimentacao: number
  uber: number
  honorario: number
  subtotal: number
  acrescimo: number
  total: number
  completo: boolean
}

// Chegam um dia antes do treinamento e voltam no dia seguinte ao último dia.
export function datasViagem(dataInicioISO: string, duracaoDias: number) {
  return { idaISO: somarDiasISO(dataInicioISO, -1), voltaISO: somarDiasISO(dataInicioISO, duracaoDias) }
}

export function calcularProposta(i: {
  destinoIata: string
  duracaoDias: number
  parametros: Parametros
  voos: Voos
}): Calculo {
  const passagens = {} as Record<OrigemId, number | null>
  for (const o of ORIGENS) passagens[o.id] = o.iata === i.destinoIata ? 0 : (i.voos[o.id]?.preco ?? null)

  const valores = Object.values(passagens)
  const totalPassagens = valores.reduce<number>((s, v) => s + (v ?? 0), 0)
  const diarias = i.duracaoDias + 1
  const diasAlimentacao = i.duracaoDias + 2
  const hotel = i.parametros.hotelDiaria * diarias * PESSOAS
  const alimentacao = i.parametros.alimentacaoDia * diasAlimentacao * PESSOAS
  const uber = i.parametros.uberFixo
  const honorario = i.parametros.honorario
  const subtotal = totalPassagens + hotel + alimentacao + uber + honorario
  const acrescimo = Math.round((subtotal * i.parametros.acrescimoPct) / 10000)

  return {
    passagens,
    totalPassagens,
    diarias,
    diasAlimentacao,
    hotel,
    alimentacao,
    uber,
    honorario,
    subtotal,
    acrescimo,
    total: subtotal + acrescimo,
    completo: valores.every((v) => v !== null),
  }
}
