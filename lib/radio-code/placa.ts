// Utilitários puros de placa brasileira (antiga LLLNNNN e Mercosul LLLNLNN).
// O que diferencia os formatos é o 5º caractere: dígito = antiga, letra = Mercosul.

export type FormatoPlaca = "Mercosul" | "Antiga" | "Desconhecido"

// Tabela oficial da migração: apenas o 5º caractere muda, dígito -> letra.
const DIGITO_PARA_LETRA: Record<string, string> = {
  "0": "A", "1": "B", "2": "C", "3": "D", "4": "E",
  "5": "F", "6": "G", "7": "H", "8": "I", "9": "J",
}
const LETRA_PARA_DIGITO: Record<string, string> = Object.fromEntries(
  Object.entries(DIGITO_PARA_LETRA).map(([d, l]) => [l, d]),
)

/** Remove tudo que não é letra/número e coloca em maiúsculas. */
export function normalizarPlaca(bruta: string): string {
  return (bruta || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

/** Placa normalizada tem exatamente 7 caracteres. */
export function placaValida(placa: string): boolean {
  return /^[A-Z0-9]{7}$/.test(placa)
}

export function detectarFormato(placa: string): FormatoPlaca {
  if (!placaValida(placa)) return "Desconhecido"
  const c5 = placa[4]
  if (/[0-9]/.test(c5)) return "Antiga"
  if (/[A-Z]/.test(c5)) return "Mercosul"
  return "Desconhecido"
}

/**
 * Converte Mercosul <-> antiga trocando o 5º caractere pela tabela oficial.
 * Retorna null quando não há conversão possível (letra fora de A–J).
 */
export function converterPlaca(placa: string): string | null {
  if (!placaValida(placa)) return null
  const c5 = placa[4]
  const novo = LETRA_PARA_DIGITO[c5] ?? DIGITO_PARA_LETRA[c5]
  if (!novo) return null
  return placa.slice(0, 4) + novo + placa.slice(5, 7)
}

/** Exibição com hífen: AXU9B03 -> AXU-9B03. */
export function formatarPlaca(placa: string): string {
  const p = normalizarPlaca(placa)
  return p.length > 3 ? `${p.slice(0, 3)}-${p.slice(3)}` : p
}
