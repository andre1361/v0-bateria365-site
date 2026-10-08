import { describe, expect, test } from "bun:test"
import { AEROPORTOS, aeroportoPorIata, buscarAeroportos, sugerirAeroporto } from "./aeroportos"

describe("lista", () => {
  test("códigos únicos e com 3 letras", () => {
    const codigos = AEROPORTOS.map((a) => a.iata)
    expect(new Set(codigos).size).toBe(codigos.length)
    for (const c of codigos) expect(c).toMatch(/^[A-Z]{3}$/)
  })
  test("inclui as duas origens", () => {
    expect(aeroportoPorIata("POA")?.cidade).toBe("Porto Alegre")
    expect(aeroportoPorIata("SJP")?.cidade).toBe("São José do Rio Preto")
    expect(aeroportoPorIata("sjp")?.iata).toBe("SJP")
    expect(aeroportoPorIata("XXX")).toBeUndefined()
  })
})

describe("buscarAeroportos", () => {
  test("sem acento e sem caixa", () => {
    expect(buscarAeroportos("sao jose")[0].iata).toBe("SJP")
    expect(buscarAeroportos("RIBEIRAO")[0].iata).toBe("RAO")
  })
  test("código exato vem primeiro", () => {
    expect(buscarAeroportos("sjp")[0].iata).toBe("SJP")
    expect(buscarAeroportos("vcp")[0].iata).toBe("VCP")
  })
  test("busca pelo nome do aeroporto", () => {
    expect(buscarAeroportos("viracopos").map((a) => a.iata)).toContain("VCP")
  })
  test("vazio não lista nada e o limite é respeitado", () => {
    expect(buscarAeroportos("  ")).toEqual([])
    expect(buscarAeroportos("a", 3).length).toBe(3)
  })
})

describe("sugerirAeroporto", () => {
  test.each([
    ["Campinas - SP", "VCP"],
    ["SÃO JOSÉ DO RIO PRETO/SP", "SJP"],
    ["Ribeirão Preto, SP", "RAO"],
    ["São Paulo", "CGH"],
    ["Belo Horizonte (MG)", "CNF"],
    ["  salvador ", "SSA"],
    ["Ji-Paraná", "JPR"],
    ["Ji-Paraná - RO", "JPR"],
    ["Campinas-SP", "VCP"],
  ])("%p → %p", (cidade, iata) => {
    expect(sugerirAeroporto(cidade)?.iata).toBe(iata)
  })
  test("cidade sem aeroporto ou vazia → null", () => {
    expect(sugerirAeroporto("Cidadezinha")).toBeNull()
    expect(sugerirAeroporto("")).toBeNull()
  })
})
