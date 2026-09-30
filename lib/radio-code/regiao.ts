import { createHmac, timingSafeEqual } from "crypto"
import UFS from "./ufs-brasil.json"

// Trava por região da consulta do código do rádio.
// IMPORTANTE: só para código de servidor (rotas e server components).

// Estados que já receberam o Bateria 365. Para liberar um estado novo, é só incluir a sigla aqui.
export const ESTADOS_LIBERADOS = ["RS", "SC", "PR", "SP", "MG", "MS", "GO", "TO", "AM", "AL", "PB"]

export const REGIAO_COOKIE = "codigo_radio_regiao"
// Vale 24h; depois disso a localização é pedida de novo.
export const REGIAO_MAX_AGE = 60 * 60 * 24

export const MENSAGEM_REGIAO_BLOQUEADA =
  "Sua região ainda não efetuou Bateria 365. O acesso é disponibilizado apenas para regiões que já efetuaram o treinamento."

// Malha de UFs do IBGE (qualidade intermediária, coordenadas [lng, lat] arredondadas em 3 casas).
type Anel = [number, number][]
const MALHA = UFS as unknown as Record<string, Anel[][]>

function dentroDoAnel(lng: number, lat: number, anel: Anel) {
  let dentro = false
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]
    const [xj, yj] = anel[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}

// Distância (em graus) do ponto até a borda mais próxima do anel.
function distanciaAoAnel(lng: number, lat: number, anel: Anel) {
  let min = Infinity
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [ax, ay] = anel[j]
    const [bx, by] = anel[i]
    const dx = bx - ax
    const dy = by - ay
    const t = dx || dy ? Math.max(0, Math.min(1, ((lng - ax) * dx + (lat - ay) * dy) / (dx * dx + dy * dy))) : 0
    min = Math.min(min, Math.hypot(lng - (ax + t * dx), lat - (ay + t * dy)))
  }
  return min
}

// Tolerância para GPS no litoral ou colado na divisa (a malha é simplificada): ~10 km.
const TOLERANCIA_GRAUS = 0.1

// Sigla da UF que contém a coordenada, ou null se estiver fora do Brasil.
export function ufPorCoordenada(lat: number, lng: number): string | null {
  let maisPerto: { uf: string; d: number } | null = null
  for (const [uf, poligonos] of Object.entries(MALHA)) {
    for (const [externo, ...buracos] of poligonos) {
      if (dentroDoAnel(lng, lat, externo) && !buracos.some((b) => dentroDoAnel(lng, lat, b))) return uf
      const d = distanciaAoAnel(lng, lat, externo)
      if (!maisPerto || d < maisPerto.d) maisPerto = { uf, d }
    }
  }
  return maisPerto && maisPerto.d <= TOLERANCIA_GRAUS ? maisPerto.uf : null
}

// Cookie assinado "UF.expiraEm.assinatura", para a liberação não poder ser forjada.
function segredo() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "bateria365-codigo-radio"
}

function assinar(dados: string) {
  return createHmac("sha256", segredo()).update(`${dados}::codigo-radio-regiao`).digest("hex")
}

export function criarTokenRegiao(uf: string) {
  const dados = `${uf}.${Date.now() + REGIAO_MAX_AGE * 1000}`
  return `${dados}.${assinar(dados)}`
}

// UF liberada gravada no cookie, ou null se ausente, vencido, adulterado ou de estado fora da lista.
export function ufLiberadaDoToken(token: string | undefined): string | null {
  const [uf, expira, assinatura] = token?.split(".") ?? []
  if (!uf || !expira || !assinatura) return null
  const esperado = Buffer.from(assinar(`${uf}.${expira}`))
  const recebido = Buffer.from(assinatura)
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null
  if (Number(expira) < Date.now() || !ESTADOS_LIBERADOS.includes(uf)) return null
  return uf
}
