import { describe, expect, test } from "bun:test"
import { decodificarJis } from "./jis"

describe("decodificarJis", () => {
  test("55B24L", () => {
    expect(decodificarJis("55B24L")).toEqual({ codigo: "55B24L", classe: 55, caixa: "B", larguraMm: 127, comprimentoCm: 24, polo: "L", cca: 370 })
  })

  test.each(["55b24-l", " 55 B24 L ", "55B24LS", "55B24LMF"])("normaliza %p", (texto) => {
    const d = decodificarJis(texto)
    expect(d?.codigo).toBe("55B24L")
    expect(d?.cca).toBe(370)
  })

  test("80D26R", () => {
    const d = decodificarJis("80D26R")!
    expect(d.polo).toBe("R")
    expect(d.larguraMm).toBe(173)
    expect(d.cca).toBe(490)
  })

  test("95D31 sem polo", () => {
    const d = decodificarJis("95D31")!
    expect(d.polo).toBeNull()
    expect(d.cca).toBe(565)
  })

  test("105D31L com classe de 3 dígitos", () => {
    expect(decodificarJis("105D31L")?.cca).toBe(655)
  })

  test("código válido fora da tabela não tem CCA", () => {
    const d = decodificarJis("40B20L")!
    expect(d.classe).toBe(40)
    expect(d.cca).toBeNull()
  })

  test.each(["XYZ", "", "55Z24L", "5B24L", "55B2L"])("inválido %p", (texto) => {
    expect(decodificarJis(texto)).toBeNull()
  })
})
