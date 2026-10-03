import { describe, expect, test } from "bun:test"
import type { NormaId } from "./normas"
import { MOTIVOS, calcularParecer, climaPorUf, type Clima, type Veiculo } from "./parecer"

const bat = (valor: number, norma: NormaId = "sae") => ({ valor, norma })
const parecer = (original: number, candidata: number, veiculo: Veiculo = "flex", clima: Clima = "tropical") =>
  calcularParecer({ original: bat(original), candidata: bat(candidata), veiculo, clima })

describe("flex em clima tropical", () => {
  test.each([
    [500, "compativel", 100],
    [600, "compativel", 120],
    [450, "aceitavel", 90],
    [445, "ressalva", 89],
    [400, "ressalva", 80],
    [395, "nao-recomendado", 79],
  ])("original 500, candidata %p → %p", (candidata, nivel, porcentagem) => {
    const p = parecer(500, candidata as number)
    expect(p.nivel).toBe(nivel as string)
    expect(p.porcentagem).toBe(porcentagem as number)
  })

  test("mais de 20% abaixo explica o motivo", () => {
    expect(parecer(500, 395).motivos).toContain(MOTIVOS.muitoAbaixo)
  })

  test("fronteiras com ponto flutuante não caem para a faixa de baixo", () => {
    expect(parecer(600, 540)).toMatchObject({ nivel: "aceitavel", porcentagem: 90 })
    expect(parecer(600, 480)).toMatchObject({ nivel: "ressalva", porcentagem: 80 })
  })

  test("0,899 é ressalva e mostra 89%, não 90%", () => {
    expect(parecer(1000, 899)).toMatchObject({ nivel: "ressalva", porcentagem: 89 })
  })
})

describe("regra exigente", () => {
  test("diesel: igual passa, abaixo não", () => {
    expect(parecer(500, 500, "diesel").nivel).toBe("compativel")
    const p = parecer(500, 499, "diesel")
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.diesel)
  })

  test("start-stop sempre avisa sobre a tecnologia", () => {
    const ok = parecer(500, 520, "start-stop")
    expect(ok.nivel).toBe("compativel")
    expect(ok.motivos).toContain(MOTIVOS.tecnologia)
    const ruim = parecer(500, 450, "start-stop")
    expect(ruim.nivel).toBe("nao-recomendado")
    expect(ruim.motivos).toContain(MOTIVOS.startStop)
    expect(ruim.motivos).toContain(MOTIVOS.tecnologia)
  })

  test("clima frio: 90% não é recomendado", () => {
    const p = parecer(500, 450, "flex", "frio")
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.frio)
  })
})

describe("normas", () => {
  const cmp = (original: ReturnType<typeof bat>, candidata: ReturnType<typeof bat>, veiculo: Veiculo = "flex", clima: Clima = "tropical") =>
    calcularParecer({ original, candidata, veiculo, clima })

  test("normas diferentes usam o menor valor provável da candidata", () => {
    // EN 560 → SAE 582,4 a 621,6 (centro 602); com o mínimo fica 97% de 600
    const p = cmp(bat(600), bat(560, "en"))
    expect(p.nivel).toBe("aceitavel")
    expect(p.saeCandidata).toBeCloseTo(582.4)
    expect(p.saeOriginal).toBe(600)
    expect(p.motivos).toContain(MOTIVOS.normas)
  })

  test("normas diferentes usam o maior valor provável da original", () => {
    // EN 600 → SAE até 666; 650 ÷ 666 ≈ 0,976, mas diesel não aceita abaixo
    const p = cmp(bat(600, "en"), bat(650, "nbr"), "diesel")
    expect(p.saeOriginal).toBeCloseTo(666)
    expect(p.saeCandidata).toBe(650)
    expect(p.razao).toBeCloseTo(0.976, 3)
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.normas)
  })

  test("DIN na original: 524 SAE contra o máximo 546 é aceitável", () => {
    const p = cmp(bat(300, "din"), bat(524), "flex", "tropical")
    expect(p.saeOriginal).toBeCloseTo(546)
    expect(p.razao).toBeCloseTo(0.96, 2)
    expect(p.nivel).toBe("aceitavel")
    expect(p.motivos).toContain(MOTIVOS.normas)
  })

  test("mesma norma compara direto", () => {
    const p = cmp(bat(600, "en"), bat(600, "en"))
    expect(p.nivel).toBe("compativel")
    expect(p.razao).toBe(1)
    expect(p.motivos).not.toContain(MOTIVOS.normas)
  })

  test("mesma norma com faixa: 560 contra 600 em EN é 0,9333 sem aviso", () => {
    const p = cmp(bat(600, "en"), bat(560, "en"))
    expect(p.razao).toBeCloseTo(0.9333, 4)
    expect(p.nivel).toBe("aceitavel")
    expect(p.motivos).not.toContain(MOTIVOS.normas)
  })

  test("SAE contra NBR não penaliza nem avisa", () => {
    const p = cmp(bat(500), bat(500, "nbr"))
    expect(p.nivel).toBe("compativel")
    expect(p.motivos).not.toContain(MOTIVOS.normas)
  })
})

describe("motivos combinados", () => {
  test("diesel em clima frio cita os dois", () => {
    const p = parecer(500, 450, "diesel", "frio")
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.diesel)
    expect(p.motivos).toContain(MOTIVOS.frio)
  })

  test("diesel muito abaixo cita diesel e mais de 20%", () => {
    const p = parecer(500, 395, "diesel")
    expect(p.motivos).toContain(MOTIVOS.diesel)
    expect(p.motivos).toContain(MOTIVOS.muitoAbaixo)
  })
})

describe("climaPorUf", () => {
  test.each(["RS", "SC", "PR", "rs"])("%p é frio", (uf) => expect(climaPorUf(uf)).toBe("frio"))
  test.each(["SP", "AM", "MG", null, undefined])("%p é tropical", (uf) => expect(climaPorUf(uf)).toBe("tropical"))
})
