import { createHash, randomInt } from "crypto"

// Sem 0/O, 1/I/L, para não confundir quando a chave vai por WhatsApp.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function gerarChave(tamanho = 6, sortear: (max: number) => number = randomInt): string {
  let s = ""
  for (let i = 0; i < tamanho; i++) s += ALFABETO[sortear(ALFABETO.length)]
  return s
}

export function normalizarChave(s: string): string {
  return (s || "").replace(/\s/g, "").toUpperCase()
}

// Cookie e token da sessão de leitura da proposta (mesmo padrão do emitir/[slug]).
export const propostaCookieName = (slug: string) => `prop_${slug}`

export function propostaToken(chaveHash: string, slug: string): string {
  return createHash("sha256").update(`${chaveHash}::${slug}::proposta`).digest("hex")
}
