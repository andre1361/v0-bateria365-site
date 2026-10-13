// Condição padrão da proposta: entrada de 30% no aceite e o restante em 4 parcelas
// mensais. Valores em centavos; os centavos que sobram da divisão vão para as últimas.
export const ENTRADA_PCT = 30
export const PARCELAS = 4

export function condicoesPagamento(total: number): { entrada: number; parcelas: number[] } {
  const entrada = Math.round((total * ENTRADA_PCT) / 100)
  const resto = total - entrada
  const base = Math.floor(resto / PARCELAS)
  const sobra = resto - base * PARCELAS
  const parcelas = Array.from({ length: PARCELAS }, (_, i) => base + (i >= PARCELAS - sobra ? 1 : 0))
  return { entrada, parcelas }
}
