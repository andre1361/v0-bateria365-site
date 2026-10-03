// Normas de corrente de partida a frio e conversão entre elas, sempre passando pela SAE.
// Nenhum fabricante publica fator oficial: cada norma tem uma faixa [min, max] tirada das tabelas
// de mercado (CTEK, Varta, Shield). Fontes na spec docs/superpowers/specs/2026-10-03-conversor-corrente-partida-design.md.

export type NormaId = "sae" | "nbr" | "jis" | "en" | "iec" | "din" | "ca"

export type Norma = {
  id: NormaId
  sigla: string // rótulo curto dos botões
  rotulo: string // nome completo na lista de resultados
  ensaio: string
  fator: { min: number; max: number } // multiplica o valor da norma para obter SAE
  nota?: string // aviso mostrado quando a norma é escolhida
}

export type Faixa = { min: number; max: number; centro: number }

export const NORMA_PADRAO: NormaId = "sae"
export const VALOR_MIN = 50
export const VALOR_MAX = 2000

export const NORMAS: Norma[] = [
  { id: "sae", sigla: "SAE", rotulo: "SAE J537 (CCA)", ensaio: "−18 °C, 30 s, ≥7,2 V", fator: { min: 1, max: 1 } },
  { id: "nbr", sigla: "NBR", rotulo: "NBR 15940 (Brasil / Inmetro)", ensaio: "Igual à SAE", fator: { min: 1, max: 1 } },
  { id: "jis", sigla: "JIS", rotulo: "JIS D 5301 (CCA)", ensaio: "Igual à SAE (JIS de 2006 em diante)", fator: { min: 1, max: 1 } },
  { id: "en", sigla: "EN", rotulo: "EN 50342-1", ensaio: "−18 °C, 10 s ≥7,5 V + 73 s", fator: { min: 1.04, max: 1.11 } },
  {
    id: "iec",
    sigla: "IEC",
    rotulo: "IEC 60095 (antiga, 60 s)",
    ensaio: "−18 °C, 60 s, 8,4 V",
    fator: { min: 1.5, max: 1.58 },
    nota: "IEC de 2006 em diante já equivale à EN: se a etiqueta trouxer IEC com ano 2006 ou depois, use EN.",
  },
  {
    id: "din",
    sigla: "DIN",
    rotulo: "DIN 43539 / 72311",
    ensaio: "−18 °C, ≥9 V aos 30 s",
    fator: { min: 1.67, max: 1.82 },
    nota: "DIN vale cerca de 60% do EN: não confunda as duas.",
  },
  {
    id: "ca",
    sigla: "CA/MCA",
    rotulo: "CA / MCA (0 °C)",
    ensaio: "0 °C, 30 s, 7,2 V",
    fator: { min: 0.77, max: 0.81 },
    nota: "Medida a 0 °C, por isso o número é maior que a CCA.",
  },
]

export function norma(id: NormaId): Norma {
  const n = NORMAS.find((x) => x.id === id)
  if (!n) throw new Error(`Norma desconhecida: ${id}`)
  return n
}

const media = (f: Norma["fator"]) => (f.min + f.max) / 2

export function paraSae(valor: number, id: NormaId): Faixa {
  const { fator } = norma(id)
  return { min: valor * fator.min, max: valor * fator.max, centro: valor * media(fator) }
}

export function deSae(sae: Faixa, id: NormaId): Faixa {
  const { fator } = norma(id)
  return { min: sae.min / fator.max, max: sae.max / fator.min, centro: sae.centro / media(fator) }
}

// Valor de entrada convertido para todas as normas, na ordem de NORMAS (SAE primeiro). A norma de entrada sai exata.
export function converterTodas(valor: number, id: NormaId): { norma: Norma; faixa: Faixa }[] {
  const sae = paraSae(valor, id)
  return NORMAS.map((n) => ({ norma: n, faixa: n.id === id ? { min: valor, max: valor, centro: valor } : deSae(sae, n.id) }))
}

export const arredondar5 = (n: number) => Math.round(n / 5) * 5

// Aceita o valor como vem na etiqueta: "600", "600 A", "1.000".
export function validarValor(texto: string): { ok: true; valor: number } | { ok: false; erro: string } {
  let t = texto.replace(/\s/g, "").replace(/a$/i, "")
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "")
  if (t === "") return { ok: false, erro: "" }
  if (!/^\d+$/.test(t)) return { ok: false, erro: "Use só números, ex.: 500." }
  const valor = Number(t)
  if (valor < VALOR_MIN || valor > VALOR_MAX) return { ok: false, erro: `Informe um valor entre ${VALOR_MIN} e ${VALOR_MAX} A.` }
  return { ok: true, valor }
}
