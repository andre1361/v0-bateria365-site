// Formatos e conversões das propostas. Dinheiro sempre em centavos (inteiros).

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const numero2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numeroAte2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const isoBrasil = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

export function formatarBRL(centavos: number): string {
  return moeda.format(centavos / 100).replace(/\s/g, " ")
}

// Valor para preencher um campo de texto ("1.500,00"); parseBRL lê de volta.
export function formatarValorCampo(centavos: number): string {
  return numero2.format(centavos / 100)
}

// Lê valores no formato brasileiro: ponto separa milhar e vírgula separa decimal.
// Sem vírgula, "1.500" é milhar e "350.5" é decimal. Negativos e lixo viram null.
export function parseBRL(texto: string): number | null {
  const t = (texto || "").replace(/R\$/gi, "").replace(/\s/g, "")
  if (!t) return null
  let normal: string
  if (t.includes(",")) {
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(t)) return null
    normal = t.replace(/\./g, "").replace(",", ".")
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    normal = t.replace(/\./g, "")
  } else if (/^\d+(\.\d{1,2})?$/.test(t)) {
    normal = t
  } else {
    return null
  }
  return Math.round(parseFloat(normal) * 100)
}

export function formatarPercentual(centesimos: number): string {
  return numeroAte2.format(centesimos / 100)
}

// "6,5" → 650 (centésimos de %). Aceita de 0 a 100%.
export function parsePercentual(texto: string): number | null {
  const t = (texto || "").replace(/%/g, "").replace(/\s/g, "")
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(t)) return null
  const v = Math.round(parseFloat(t.replace(",", ".")) * 100)
  return v <= 10000 ? v : null
}

function partes(iso: string): [number, number, number] {
  const [a, m, d] = iso.split("-").map(Number)
  return [a, m, d]
}

export function somarDiasISO(iso: string, dias: number): string {
  const [a, m, d] = partes(iso)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

export function isoValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [a, m, d] = partes(iso)
  const dt = new Date(Date.UTC(a, m - 1, d))
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function formatarDataISO(iso: string): string {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export function formatarDataComDia(iso: string): string {
  const [a, m, d] = partes(iso)
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
  return `${dia} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`
}

// Data (AAAA-MM-DD) de um instante no fuso de São Paulo.
export function dataISONoBrasil(d: Date): string {
  return isoBrasil.format(d)
}

export function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}
