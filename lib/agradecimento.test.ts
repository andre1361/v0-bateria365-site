import { describe, expect, test } from "bun:test"
import { mensagemAgradecimento } from "./agradecimento"
import { whatsappPhone } from "./phone"

describe("mensagemAgradecimento", () => {
  test("monta a mensagem completa em nome do distribuidor", () => {
    const msg = mensagemAgradecimento({
      empresa: "Bateria Sul",
      responsavel: "Fábio",
      distribuidor: "Distribuidora X",
      treinamento: "Treinamento Moura",
      data: "10/10/2026",
      participantes: 3,
    })
    expect(msg).toStartWith("Olá, Fábio! Tudo bem?\nAqui é Distribuidora X, distribuidor Moura")
    expect(msg).toContain('participação da Bateria Sul do treinamento "Treinamento Moura" em 10/10/2026!')
    expect(msg).toContain("presença dos 3 participantes")
    expect(msg).toEndWith("Um abraço, Distribuidora X.")
  })

  test("funciona sem responsável, distribuidor, treinamento e participantes", () => {
    const msg = mensagemAgradecimento({ empresa: "Loja Y" })
    expect(msg).toStartWith("Olá! Tudo bem?\nAqui é o distribuidor Moura")
    expect(msg).toContain("participação da Loja Y do treinamento! 🙏")
    expect(msg).not.toContain("presença")
    expect(msg).not.toContain("undefined")
    expect(msg).toEndWith("Um abraço!")
  })

  test("singular para um participante", () => {
    expect(mensagemAgradecimento({ empresa: "Z", participantes: 1 })).toContain("presença de vocês")
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
