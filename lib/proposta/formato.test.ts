import { describe, expect, test } from "bun:test"
import {
  dataISONoBrasil,
  formatarBRL,
  formatarDataComDia,
  formatarDataISO,
  formatarDuracao,
  formatarPercentual,
  formatarValorCampo,
  isoValida,
  parseBRL,
  parsePercentual,
  somarDiasISO,
} from "./formato"

describe("dinheiro", () => {
  test("formata em reais com espaço normal", () => {
    expect(formatarBRL(150000)).toBe("R$ 1.500,00")
    expect(formatarBRL(0)).toBe("R$ 0,00")
    expect(formatarBRL(1810000)).toBe("R$ 18.100,00")
  })

  test.each([
    ["350", 35000],
    ["350,00", 35000],
    ["1.500", 150000],
    ["1.500,50", 150050],
    ["1.500,5", 150050],
    ["R$ 12.000,00", 1200000],
    ["350.5", 35050],
    ["1.50", 150],
    [" 200 ", 20000],
    ["0", 0],
  ])("parseBRL(%p) = %p centavos", (texto, centavos) => {
    expect(parseBRL(texto as string)).toBe(centavos as number)
  })

  test.each(["", "-50", "12,345", "abc", "1.50.0", "1,5,0"])("parseBRL(%p) recusa", (texto) => {
    expect(parseBRL(texto)).toBeNull()
  })

  test("valor do campo volta igual pelo parse", () => {
    for (const c of [0, 99, 35000, 150050, 1200000]) expect(parseBRL(formatarValorCampo(c))).toBe(c)
    expect(formatarValorCampo(150050)).toBe("1.500,50")
  })
})

describe("percentual", () => {
  test.each([
    ["6,5", 650],
    ["6.5", 650],
    ["0", 0],
    ["10%", 1000],
    ["100", 10000],
  ])("parsePercentual(%p) = %p", (texto, v) => {
    expect(parsePercentual(texto as string)).toBe(v as number)
  })
  test.each(["101", "-1", "", "abc"])("parsePercentual(%p) recusa", (texto) => {
    expect(parsePercentual(texto)).toBeNull()
  })
  test("formata sem zeros à toa", () => {
    expect(formatarPercentual(650)).toBe("6,5")
    expect(formatarPercentual(0)).toBe("0")
  })
})

describe("datas", () => {
  test("soma dias atravessando mês, ano e bissexto", () => {
    expect(somarDiasISO("2026-10-31", 1)).toBe("2026-11-01")
    expect(somarDiasISO("2027-01-01", -1)).toBe("2026-12-31")
    expect(somarDiasISO("2028-02-28", 1)).toBe("2028-02-29")
  })
  test("valida AAAA-MM-DD de verdade", () => {
    expect(isoValida("2026-10-14")).toBe(true)
    expect(isoValida("2026-02-30")).toBe(false)
    expect(isoValida("14/10/2026")).toBe(false)
    expect(isoValida("")).toBe(false)
  })
  test("formata para exibição", () => {
    expect(formatarDataISO("2026-10-14")).toBe("14/10/2026")
    expect(formatarDataComDia("2026-10-13")).toBe("ter 13/10")
  })
  test("hoje segue o fuso de São Paulo", () => {
    expect(dataISONoBrasil(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-08")
    expect(dataISONoBrasil(new Date("2026-10-09T03:30:00Z"))).toBe("2026-10-09")
  })
  test("duração do voo", () => {
    expect(formatarDuracao(175)).toBe("2h55")
    expect(formatarDuracao(120)).toBe("2h00")
    expect(formatarDuracao(45)).toBe("45min")
  })
})
