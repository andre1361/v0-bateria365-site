import { randomBytes } from "crypto"

// Senha legível do distribuidor, sem caracteres ambíguos, no formato ABCD-2345.
export function gerarSenha() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const b = randomBytes(8)
  let s = ""
  for (let i = 0; i < 8; i++) s += abc[b[i] % abc.length]
  return s.slice(0, 4) + "-" + s.slice(4)
}
