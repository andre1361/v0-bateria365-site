import { describe, expect, test } from "bun:test"
import { slugify } from "./slug"

describe("slugify", () => {
  test("remove acentos, espaços e símbolos", () => {
    expect(slugify("São José do Rio Preto - Treinamento")).toBe("sao-jose-do-rio-preto-treinamento")
  })
  test("texto vazio vira vazio", () => {
    expect(slugify("")).toBe("")
  })
})
