import { paraSae, type NormaId } from "./normas"

// Parecer "essa bateria serve no lugar da original?" com margem para clima tropical.
// As faixas são inferência da Bateria 365 a partir das fontes da spec, não norma publicada:
// fora do Sul a bateria entrega mais e o motor pede menos, mas a conversão entre normas tem
// incerteza de ±10% e a bateria perde CCA com o uso.

export type Veiculo = "flex" | "diesel" | "start-stop"
export type Clima = "tropical" | "frio"
export type Nivel = "compativel" | "aceitavel" | "ressalva" | "nao-recomendado"
export type BateriaInformada = { valor: number; norma: NormaId }

export type Parecer = {
  nivel: Nivel
  razao: number // candidata ÷ original, em SAE
  porcentagem: number // truncada: 0,899 → 89
  saeOriginal: number
  saeCandidata: number
  titulo: string
  explicacao: string
  motivos: string[]
}

export const UFS_FRIAS = ["RS", "SC", "PR"]

export const TITULOS: Record<Nivel, string> = {
  compativel: "Compatível",
  aceitavel: "Aceitável",
  ressalva: "Só com ressalva",
  "nao-recomendado": "Não recomendado",
}

const EXPLICACOES: Record<Nivel, string> = {
  compativel: "A bateria tem corrente de partida igual ou maior que a original. Pode instalar: corrente maior não prejudica o carro.",
  aceitavel:
    "Até 10% abaixo da original: dentro da diferença entre as normas. Em clima quente a bateria entrega mais corrente e o motor pede menos para girar.",
  ressalva:
    "Entre 10% e 20% abaixo da original. Só para carro flex/gasolina com bateria convencional, fora do Sul e das serras, e com sistema elétrico original. Avise o cliente.",
  "nao-recomendado": "A bateria não atende à corrente de partida que o veículo precisa.",
}

export const MOTIVOS = {
  muitoAbaixo: "Está mais de 20% abaixo da original.",
  diesel: "Motor diesel exige corrente de partida igual ou maior que a original.",
  startStop: "Start-stop exige corrente de partida igual ou maior que a original.",
  frio: "Em região fria (Sul e serras) use corrente de partida igual ou maior que a original.",
  tecnologia: "Start-stop exige a mesma tecnologia da original: EFB por EFB (ou AGM), AGM só por AGM.",
  normas: "Normas diferentes: comparamos o pior caso da conversão (menor valor provável da bateria que você tem e maior valor provável da original).",
}

// Folga para divisões como 540 ÷ 600 não caírem abaixo de 0,9 por ponto flutuante.
const EPS = 1e-9

export function climaPorUf(uf: string | null | undefined): Clima {
  return uf && UFS_FRIAS.includes(uf.toUpperCase()) ? "frio" : "tropical"
}

export function calcularParecer({
  original,
  candidata,
  veiculo,
  clima,
}: {
  original: BateriaInformada
  candidata: BateriaInformada
  veiculo: Veiculo
  clima: Clima
}): Parecer {
  const mesmaNorma = original.norma === candidata.norma
  const faixaOriginal = paraSae(original.valor, original.norma)
  const faixaCandidata = paraSae(candidata.valor, candidata.norma)
  // Normas diferentes: pior caso das duas conversões (candidata no mínimo, original no máximo),
  // para a incerteza nunca favorecer a candidata.
  const comIncerteza = !mesmaNorma && (faixaCandidata.min < faixaCandidata.max || faixaOriginal.min < faixaOriginal.max)
  const saeCandidata = mesmaNorma ? faixaCandidata.centro : faixaCandidata.min
  const saeOriginal = mesmaNorma ? faixaOriginal.centro : faixaOriginal.max
  const razao = mesmaNorma ? candidata.valor / original.valor : saeCandidata / saeOriginal
  const r = razao + EPS

  const exigente = veiculo !== "flex" || clima === "frio"
  let nivel: Nivel
  if (r >= 1) nivel = "compativel"
  else if (exigente) nivel = "nao-recomendado"
  else if (r >= 0.9) nivel = "aceitavel"
  else if (r >= 0.8) nivel = "ressalva"
  else nivel = "nao-recomendado"

  const motivos: string[] = []
  if (nivel === "nao-recomendado") {
    if (veiculo === "diesel") motivos.push(MOTIVOS.diesel)
    if (veiculo === "start-stop") motivos.push(MOTIVOS.startStop)
    if (clima === "frio") motivos.push(MOTIVOS.frio)
    if (r < 0.8) motivos.push(MOTIVOS.muitoAbaixo)
  }
  if (veiculo === "start-stop") motivos.push(MOTIVOS.tecnologia)
  if (comIncerteza) motivos.push(MOTIVOS.normas)

  return {
    nivel,
    razao,
    porcentagem: Math.floor(r * 100),
    saeOriginal,
    saeCandidata,
    titulo: TITULOS[nivel],
    explicacao: EXPLICACOES[nivel],
    motivos,
  }
}
