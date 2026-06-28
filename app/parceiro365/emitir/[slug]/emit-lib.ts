import { createHash } from "crypto"

// Cookie e token da sessão de auto-emissão (por link/slug).
export const emitCookieName = (slug: string) => `emit_${slug}`

export function emitToken(senhaHash: string, slug: string): string {
  return createHash("sha256").update(`${senhaHash}::${slug}::emit`).digest("hex")
}
