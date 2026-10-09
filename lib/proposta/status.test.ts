import { describe, expect, test } from "bun:test"
import { calcularValidade, podeEditar, statusEfetivo, validadeEfetiva } from "./status"

const agora = new Date("2026-10-08T15:00:00Z")

describe("statusEfetivo", () => {
  test("enviada dentro da validade continua enviada", () => {
    expect(statusEfetivo("enviada", new Date("2026-10-18T15:00:00Z"), agora)).toBe("enviada")
  })
  test("enviada vencida (ou exatamente no limite) vira expirada", () => {
    expect(statusEfetivo("enviada", new Date("2026-10-08T14:59:59Z"), agora)).toBe("expirada")
    expect(statusEfetivo("enviada", agora, agora)).toBe("expirada")
  })
  test("aceita, cancelada e rascunho não expiram", () => {
    expect(statusEfetivo("aceita", new Date("2020-01-01"), agora)).toBe("aceita")
    expect(statusEfetivo("cancelada", new Date("2020-01-01"), agora)).toBe("cancelada")
    expect(statusEfetivo("rascunho", null, agora)).toBe("rascunho")
  })
})

describe("podeEditar", () => {
  test.each([
    ["rascunho", true],
    ["enviada", true],
    ["expirada", true],
    ["aceita", false],
    ["cancelada", false],
  ] as const)("%p → %p", (s, esperado) => {
    expect(podeEditar(s)).toBe(esperado)
  })
})

test("validade soma dias corridos ao instante do envio", () => {
  expect(calcularValidade(agora, 10).toISOString()).toBe("2026-10-18T15:00:00.000Z")
})

describe("validadeEfetiva", () => {
  test("caso normal: fim do dia (São Paulo) de hoje + dias", () => {
    expect(validadeEfetiva(agora, 10, "2026-12-01")?.toISOString()).toBe("2026-10-19T02:59:59.000Z")
  })
  test("limitada ao fim do dia anterior à ida", () => {
    expect(validadeEfetiva(agora, 10, "2026-10-12")?.toISOString()).toBe("2026-10-12T02:59:59.000Z")
  })
  test("null quando o dia anterior à ida já passou (ida hoje ou antes)", () => {
    expect(validadeEfetiva(agora, 10, "2026-10-08")).toBeNull()
    expect(validadeEfetiva(agora, 10, "2026-10-07")).toBeNull()
  })
  test("ida amanhã: vale até o fim de hoje", () => {
    expect(validadeEfetiva(agora, 10, "2026-10-09")?.toISOString()).toBe("2026-10-09T02:59:59.000Z")
  })
  test("agora às 01:00Z ainda é o dia anterior em São Paulo", () => {
    const cedo = new Date("2026-10-09T01:00:00Z")
    expect(validadeEfetiva(cedo, 1, "2026-12-01")?.toISOString()).toBe("2026-10-10T02:59:59.000Z")
  })
})
