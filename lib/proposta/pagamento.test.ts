import { describe, expect, test } from "bun:test"
import { condicoesPagamento } from "./pagamento"

describe("condicoesPagamento", () => {
  test("igual à proposta de Palmas (R$ 17.485,00)", () => {
    expect(condicoesPagamento(1748500)).toEqual({ entrada: 524550, parcelas: [305987, 305987, 305988, 305988] })
  })
  test("a soma sempre fecha o total", () => {
    for (const total of [0, 1, 99, 1234567, 2340000, 4999999]) {
      const c = condicoesPagamento(total)
      expect(c.entrada + c.parcelas.reduce((s, v) => s + v, 0)).toBe(total)
    }
  })
})
