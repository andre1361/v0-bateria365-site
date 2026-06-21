import { createHash } from "crypto"

// Módulo de autenticação do Editor de Convites.
// IMPORTANTE: este arquivo só deve ser importado por código de servidor
// (server actions e server components). Nunca importe em componentes "use client".

// Nome do cookie de sessão do editor.
export const CONVITES_COOKIE = "convites_auth"

// Duração da sessão: 8 horas.
export const CONVITES_SESSION_MAX_AGE = 60 * 60 * 8

// Senha de acesso ao editor. Pode ser sobrescrita pela variável de ambiente
// CONVITES_PASSWORD, com fallback para o valor padrão combinado.
// Não depende de banco de dados.
export function getConvitesPassword(): string {
  return process.env.CONVITES_PASSWORD ?? "Mour@365"
}

// Token derivado da senha (hash SHA-256). É o valor gravado no cookie httpOnly,
// para que a sessão não possa ser forjada sem conhecer a senha.
export function getConvitesToken(): string {
  return createHash("sha256").update(`${getConvitesPassword()}::bateria365-convites`).digest("hex")
}
