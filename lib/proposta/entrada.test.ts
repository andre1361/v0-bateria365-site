import { describe, expect, test } from "bun:test"
import { validarEntrada } from "./entrada"
import { PADROES } from "./padroes"

const HOJE = "2026-10-08"
const base = () => ({
  distributorId: "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b",
  destinoIata: "SSA",
  dataInicioISO: "2026-10-20",
  duracaoDias: 1,
  parametros: { ...PADROES.parametros },
  validadeDias: 10,
  voos: {
    poa: { modo: "serpapi", preco: 138900, companhia: "GOL", partida: "2026-10-19 10:20", chegada: "2026-10-19 13:30", duracaoMin: 190, escalas: 0 },
    sjp: { modo: "manual", preco: 180000 },
  },
})
const erro = (raw: unknown, completa = false) => {
  const r = validarEntrada(raw, HOJE, completa)
  return r.ok ? null : r.erro
}

describe("aceita o que é válido", () => {
  test("rascunho e envio", () => {
    expect(validarEntrada(base(), HOJE, false).ok).toBe(true)
    expect(validarEntrada(base(), HOJE, true).ok).toBe(true)
  })
  test("rascunho pode estar incompleto", () => {
    expect(validarEntrada({ ...base(), destinoIata: "", dataInicioISO: "", voos: {} }, HOJE, false).ok).toBe(true)
  })
  test("IATA em minúsculas é normalizado", () => {
    const r = validarEntrada({ ...base(), destinoIata: "ssa" }, HOJE, false)
    expect(r.ok && r.valor.destinoIata).toBe("SSA")
  })
})

describe("recusa dados adulterados", () => {
  test.each([
    [{ distributorId: "abc" }, "Escolha o distribuidor."],
    [{ destinoIata: "XXX" }, "Aeroporto de destino inválido."],
    [{ dataInicioISO: "2026-02-30" }, "Data do treinamento inválida."],
    [{ duracaoDias: 0 }, "A duração deve ser de 1 a 10 dias."],
    [{ duracaoDias: 50 }, "A duração deve ser de 1 a 10 dias."],
    [{ duracaoDias: 1.5 }, "A duração deve ser de 1 a 10 dias."],
    [{ validadeDias: 0 }, "A validade deve ser de 1 a 60 dias."],
  ])("%p", (troca, msg) => {
    expect(erro({ ...base(), ...troca })).toBe(msg)
  })
  test("custo negativo ou em texto", () => {
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, hotelDiaria: -1 } })).toBe("Revise os valores de custo.")
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, honorario: "12000" } })).toBe("Revise os valores de custo.")
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, acrescimoPct: 10001 } })).toBe("Revise os valores de custo.")
  })
  test("custo acima de R$ 500 mil é recusado (evita estourar o int4 do total)", () => {
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, honorario: 50_000_001 } })).toBe("Revise os valores de custo.")
    expect(validarEntrada({ ...base(), parametros: { ...PADROES.parametros, honorario: 50_000_000 } }, HOJE, false).ok).toBe(true)
  })
  test("voo com preço negativo ou modo desconhecido", () => {
    expect(erro({ ...base(), voos: { poa: { modo: "serpapi", preco: -100 } } })).toBe("Voo de Porto Alegre inválido.")
    expect(erro({ ...base(), voos: { sjp: { modo: "grátis", preco: 0 } } })).toBe("Voo de São José do Rio Preto inválido.")
  })
  test("campos extras são descartados", () => {
    const r = validarEntrada({ ...base(), total: 1, voos: { ...base().voos, xyz: { modo: "manual", preco: 1 } } }, HOJE, false)
    if (!r.ok) throw new Error(r.erro)
    expect("total" in r.valor).toBe(false)
    expect(Object.keys(r.valor.voos).sort()).toEqual(["poa", "sjp"])
  })
  test("destino igual a uma origem força passagem local zero", () => {
    const r = validarEntrada({ ...base(), destinoIata: "POA" }, HOJE, true)
    if (!r.ok) throw new Error(r.erro)
    expect(r.valor.voos.poa).toEqual({ modo: "local", preco: 0 })
  })
  test("modo local vindo do navegador para outro destino é descartado", () => {
    const r = validarEntrada({ ...base(), voos: { poa: { modo: "local", preco: 0 } } }, HOJE, false)
    expect(r.ok && r.valor.voos.poa).toBeUndefined()
  })
})

describe("exigências para gerar o link", () => {
  test("data a partir de amanhã (a ida é no dia anterior)", () => {
    expect(erro({ ...base(), dataInicioISO: HOJE }, true)).toBe("O treinamento precisa começar a partir de amanhã (a ida é no dia anterior).")
    expect(erro({ ...base(), dataInicioISO: "2026-10-01" }, true)).toBe("O treinamento precisa começar a partir de amanhã (a ida é no dia anterior).")
    expect(erro({ ...base(), dataInicioISO: "2026-10-09" }, true)).toBeNull()
  })
  test("destino e data obrigatórios", () => {
    expect(erro({ ...base(), destinoIata: "" }, true)).toBe("Escolha o aeroporto de destino.")
    expect(erro({ ...base(), dataInicioISO: "" }, true)).toBe("Informe a data do treinamento.")
  })
  test("voo das duas origens, com preço maior que zero", () => {
    expect(erro({ ...base(), voos: { poa: base().voos.poa } }, true)).toBe("Escolha o voo (ou informe o valor) de São José do Rio Preto.")
    expect(erro({ ...base(), voos: { ...base().voos, sjp: { modo: "manual", preco: 0 } } }, true)).toBe(
      "Escolha o voo (ou informe o valor) de São José do Rio Preto.",
    )
  })
})
