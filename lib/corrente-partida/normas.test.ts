import { describe, expect, test } from "bun:test"
import { NORMAS, arredondar5, converterTodas, deSae, paraSae, validarValor } from "./normas"

describe("paraSae / deSae", () => {
  test("SAE para SAE é identidade", () => {
    expect(paraSae(500, "sae")).toEqual({ min: 500, max: 500, centro: 500 })
  })

  test("EN 600 vira SAE 624–666", () => {
    const f = paraSae(600, "en")
    expect(f.min).toBeCloseTo(624)
    expect(f.max).toBeCloseTo(666)
    expect(f.centro).toBeCloseTo(645)
  })

  test("DIN 300 vira SAE 501–546", () => {
    const f = paraSae(300, "din")
    expect(f.min).toBeCloseTo(501)
    expect(f.max).toBeCloseTo(546)
  })

  test("ida e volta SAE → EN → SAE contém o valor original", () => {
    const en = deSae(paraSae(600, "sae"), "en")
    const volta = paraSae(en.centro, "en")
    expect(volta.min).toBeLessThanOrEqual(600)
    expect(volta.max).toBeGreaterThanOrEqual(600)
  })
})

describe("converterTodas", () => {
  test("lista todas as normas com SAE primeiro e a de entrada exata", () => {
    const linhas = converterTodas(600, "en")
    expect(linhas.map((l) => l.norma.id)).toEqual(NORMAS.map((n) => n.id))
    expect(linhas[0].norma.id).toBe("sae")
    expect(linhas.find((l) => l.norma.id === "en")!.faixa).toEqual({ min: 600, max: 600, centro: 600 })
  })

  test("NBR e JIS saem iguais à SAE", () => {
    const linhas = converterTodas(600, "en")
    const sae = linhas.find((l) => l.norma.id === "sae")!.faixa
    expect(linhas.find((l) => l.norma.id === "nbr")!.faixa).toEqual(sae)
    expect(linhas.find((l) => l.norma.id === "jis")!.faixa).toEqual(sae)
  })

  test("SAE 600 para NBR é exato", () => {
    expect(converterTodas(600, "sae").find((l) => l.norma.id === "nbr")!.faixa).toEqual({ min: 600, max: 600, centro: 600 })
  })
})

test("arredondar5", () => {
  expect(arredondar5(641)).toBe(640)
  expect(arredondar5(643)).toBe(645)
  expect(arredondar5(642.5)).toBe(645)
})

describe("validarValor", () => {
  test.each([
    ["600", 600],
    [" 600 A", 600],
    ["600a", 600],
    ["1.000", 1000],
    ["50", 50],
    ["2000", 2000],
  ])("aceita %p", (texto, valor) => {
    expect(validarValor(texto)).toEqual({ ok: true, valor })
  })

  test("vazio não mostra erro", () => {
    expect(validarValor("  ")).toEqual({ ok: false, erro: "" })
  })

  test.each(["abc", "12,5", "-5"])("rejeita %p", (texto) => {
    expect(validarValor(texto)).toEqual({ ok: false, erro: "Use só números, ex.: 500." })
  })

  test.each(["45", "2001"])("fora da faixa %p", (texto) => {
    expect(validarValor(texto)).toEqual({ ok: false, erro: "Informe um valor entre 50 e 2000 A." })
  })
})
