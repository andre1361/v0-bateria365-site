import { describe, expect, test } from "bun:test"
import { mensagemAgradecimento } from "./agradecimento"
import { whatsappPhone } from "./phone"

describe("mensagemAgradecimento", () => {
  test("assina com o vendedor da empresa e a distribuidora", () => {
    const msg = mensagemAgradecimento({ responsavel: "Fábio", distribuidor: "Distribuidora X", vendedor: "Carlos" })
    expect(msg).toStartWith("Olá, Fábio! Tudo bem?\nAqui é Carlos, da equipe Distribuidora X.")
    expect(msg).toContain("participação de vocês no treinamento Bateria 365!")
    expect(msg).toContain("Quando nossos parceiros crescem, a gente cresce junto.")
    expect(msg).toEndWith("Um abraço,\nCarlos · Distribuidora X")
  })

  test("sem vendedor, fala como equipe da distribuidora", () => {
    const msg = mensagemAgradecimento({ distribuidor: "Distribuidora X" })
    expect(msg).toContain("Aqui é a equipe Distribuidora X.")
    expect(msg).toEndWith("Um abraço,\nEquipe Distribuidora X")
  })

  test("funciona sem nenhum dado opcional", () => {
    const msg = mensagemAgradecimento({})
    expect(msg).toStartWith("Olá! Tudo bem?\nAqui é a equipe do seu distribuidor Moura.")
    expect(msg).not.toContain("undefined")
    expect(msg).toEndWith("Um abraço!")
  })
})

describe("whatsappPhone", () => {
  test("adiciona DDI 55 em celular e fixo", () => {
    expect(whatsappPhone("(62) 99464-8088")).toBe("5562994648088")
    expect(whatsappPhone("6232221111")).toBe("556232221111")
  })
  test("mantém número já com DDI e vazio", () => {
    expect(whatsappPhone("+55 62 99464-8088")).toBe("5562994648088")
    expect(whatsappPhone("")).toBe("")
  })
})
