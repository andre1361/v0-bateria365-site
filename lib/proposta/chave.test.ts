import { describe, expect, test } from "bun:test"
import { gerarChave, normalizarChave, propostaCookieName, propostaToken } from "./chave"

describe("gerarChave", () => {
  test("6 caracteres sem ambíguos (0, O, 1, I, L)", () => {
    for (let i = 0; i < 200; i++) expect(gerarChave()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
  })
  test("usa o sorteio injetado", () => {
    expect(gerarChave(6, () => 0)).toBe("AAAAAA")
  })
})

test("normaliza o que o distribuidor digita", () => {
  expect(normalizarChave(" ab3 k9x ")).toBe("AB3K9X")
})

describe("cookie da proposta", () => {
  test("nome por slug", () => {
    expect(propostaCookieName("salvador-treinamento-a1b2c3")).toBe("prop_salvador-treinamento-a1b2c3")
  })
  test("token muda com o slug e com o hash", () => {
    expect(propostaToken("h1", "a")).not.toBe(propostaToken("h1", "b"))
    expect(propostaToken("h1", "a")).not.toBe(propostaToken("h2", "a"))
    expect(propostaToken("h1", "a")).toBe(propostaToken("h1", "a"))
  })
})
