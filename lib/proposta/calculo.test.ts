import { describe, expect, test } from "bun:test"
import { calcularProposta, datasViagem, type Voos } from "./calculo"
import { PADROES } from "./padroes"

const voos = (poa?: number, sjp?: number): Voos => ({
  ...(poa !== undefined ? { poa: { modo: "serpapi" as const, preco: poa } } : {}),
  ...(sjp !== undefined ? { sjp: { modo: "serpapi" as const, preco: sjp } } : {}),
})
const calc = (o: { destino?: string; dias?: number; voos?: Voos; acrescimoPct?: number }) =>
  calcularProposta({
    destinoIata: o.destino ?? "SSA",
    duracaoDias: o.dias ?? 1,
    parametros: { ...PADROES.parametros, acrescimoPct: o.acrescimoPct ?? 0 },
    voos: o.voos ?? voos(150000, 180000),
  })

describe("datasViagem", () => {
  test("ida no dia anterior e volta no dia seguinte ao fim", () => {
    expect(datasViagem("2026-10-14", 1)).toEqual({ idaISO: "2026-10-13", voltaISO: "2026-10-15" })
    expect(datasViagem("2026-10-14", 3)).toEqual({ idaISO: "2026-10-13", voltaISO: "2026-10-17" })
  })
  test("atravessa mês e ano", () => {
    expect(datasViagem("2026-11-01", 1).idaISO).toBe("2026-10-31")
    expect(datasViagem("2026-12-31", 3).voltaISO).toBe("2027-01-03")
    expect(datasViagem("2027-01-01", 1).idaISO).toBe("2026-12-31")
  })
})

describe("calcularProposta", () => {
  test("exemplo da spec: 1 dia, R$ 1.500 + R$ 1.800 = R$ 18.100", () => {
    const c = calc({})
    expect(c).toMatchObject({
      totalPassagens: 330000,
      diarias: 2,
      diasAlimentacao: 3,
      hotel: 140000,
      alimentacao: 120000,
      uber: 20000,
      honorario: 1200000,
      subtotal: 1810000,
      acrescimo: 0,
      total: 1810000,
      completo: true,
    })
  })

  test("3 dias: 4 diárias e 5 dias de alimentação por pessoa", () => {
    const c = calc({ dias: 3 })
    expect(c.hotel).toBe(35000 * 4 * 2)
    expect(c.alimentacao).toBe(20000 * 5 * 2)
    expect(c.total).toBe(330000 + 280000 + 200000 + 20000 + 1200000)
  })

  test("acréscimo percentual arredondado ao centavo", () => {
    expect(calc({ acrescimoPct: 650 }).total).toBe(1810000 + 117650)
    const quebrado = calc({ acrescimoPct: 650, voos: voos(150001, 180000) })
    expect(quebrado.acrescimo).toBe(117650) // 117650,065 → 117650
  })

  test("destino igual a uma origem: passagem zero sem precisar de voo", () => {
    const c = calc({ destino: "POA", voos: voos(undefined, 180000) })
    expect(c.passagens).toEqual({ poa: 0, sjp: 180000 })
    expect(c.completo).toBe(true)
    expect(c.total).toBe(180000 + 140000 + 120000 + 20000 + 1200000)
  })

  test("falta o voo de uma origem: incompleto, sem somar nada no lugar", () => {
    const c = calc({ voos: voos(150000) })
    expect(c.completo).toBe(false)
    expect(c.passagens.sjp).toBeNull()
    expect(c.totalPassagens).toBe(150000)
  })

  test("valor manual entra igual ao da SerpApi", () => {
    const c = calc({ voos: { poa: { modo: "manual", preco: 99900 }, sjp: { modo: "serpapi", preco: 100 } } })
    expect(c.totalPassagens).toBe(100000)
  })
})
