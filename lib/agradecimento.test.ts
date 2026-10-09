import { describe, expect, test } from "bun:test"
import { mensagemAgradecimento } from "./agradecimento"
import { whatsappPhone } from "./phone"

const GODAL = "GODAL — Goiás Distribuidor de Acumuladores"

describe("mensagemAgradecimento", () => {
  test("sem vendedor, reproduz a mensagem da equipe da distribuidora", () => {
    expect(mensagemAgradecimento({ distribuidor: GODAL })).toBe(
      [
        `Aqui é a equipe ${GODAL}.`,
        "",
        "Passando para agradecer a participação de vocês no treinamento Bateria 365!",
        "Foi muito bom contar com a presença da sua equipe.",
        "Esperamos que o conteúdo ajude no dia a dia da loja e nas vendas.",
        "",
        "Para dar continuidade nos conhecimentos, acessem a plataforma da *Academia Moura*, feita sob medida para ajudá-los nos desafios do dia a dia, conforme áreas e pessoas que deseja desenvolver na sua loja.",
        "",
        "Clique abaixo:",
        "https://ead.academiamoura.com.br/",
        "",
        "Quando nossos parceiros crescem, a gente cresce junto.",
        "Conte sempre com a gente!",
        "",
        "Moura é Moura!",
        "",
        "Um abraço,",
        `Equipe ${GODAL}`,
      ].join("\n"),
    )
  })

  test("com vendedor, apresenta e assina com o nome dele", () => {
    const msg = mensagemAgradecimento({ distribuidor: "Distribuidora X", vendedor: "Carlos" })
    expect(msg).toStartWith("Aqui é Carlos, da equipe Distribuidora X.")
    expect(msg).toEndWith("Um abraço,\nCarlos · Distribuidora X")
  })

  test("funciona sem nenhum dado opcional", () => {
    const msg = mensagemAgradecimento({})
    expect(msg).toStartWith("Aqui é a equipe do seu distribuidor Moura.")
    expect(msg).not.toContain("undefined")
    expect(msg).toEndWith("Um abraço!")
  })

  test("não usa emoji, que o link do WhatsApp corrompe", () => {
    expect(mensagemAgradecimento({ distribuidor: "X", vendedor: "Y" })).not.toMatch(/\p{Extended_Pictographic}/u)
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
