import { describe, expect, test } from "bun:test"
import { calcularValidade, podeEditar, statusEfetivo } from "./status"

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
