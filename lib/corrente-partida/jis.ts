// Código de bateria JIS (ex.: 55B24L): classe de desempenho, caixa, comprimento e lado do polo negativo.
// A classe NÃO é ampère (mistura CCA e capacidade de reserva); a CCA vem de uma tabela de referência.

export type JisDecodificado = {
  codigo: string // normalizado, ex.: "55B24L"
  classe: number
  caixa: string
  larguraMm: number | null
  comprimentoCm: number
  polo: "L" | "R" | null
  cca: number | null
}

// CCA típica (catálogos GS Yuasa e listas japonesas). A etiqueta sempre prevalece.
export const CCA_JIS: Record<string, number> = {
  "34B19": 240,
  "38B19": 265,
  "46B24": 295,
  "55B24": 370,
  "60B24": 405,
  "55D23": 320,
  "75D23": 465,
  "80D23": 500,
  "80D26": 490,
  "95D31": 565,
  "105D31": 655,
  "115D31": 735,
}

const LARGURA_MM: Record<string, number> = { B: 127, D: 173 }

export function decodificarJis(texto: string): JisDecodificado | null {
  const limpo = texto.toUpperCase().replace(/[\s-]/g, "").replace(/(MF|S)$/, "")
  const m = /^(\d{2,3})([A-H])(\d{2})(L|R)?$/.exec(limpo)
  if (!m) return null
  const [, classe, caixa, comprimento, polo] = m
  return {
    codigo: limpo,
    classe: Number(classe),
    caixa,
    larguraMm: LARGURA_MM[caixa] ?? null,
    comprimentoCm: Number(comprimento),
    polo: (polo as "L" | "R" | undefined) ?? null,
    cca: CCA_JIS[`${classe}${caixa}${comprimento}`] ?? null,
  }
}
