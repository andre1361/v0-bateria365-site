// Libera a consulta do código do rádio pela localização do aparelho.
// Contrato: POST { lat, lng } -> { liberado: true, uf } | { liberado: false, uf, mensagem }.
// Se a UF está na lista, grava o cookie assinado que a página e a consulta por placa conferem.
import { type NextRequest, NextResponse } from "next/server"
import { MENSAGEM_REGIAO_BLOQUEADA, ESTADOS_LIBERADOS, REGIAO_COOKIE, REGIAO_MAX_AGE, criarTokenRegiao, ufPorCoordenada } from "@/lib/radio-code/regiao"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" }

export async function POST(req: NextRequest) {
  let lat = NaN
  let lng = NaN
  try {
    const body = await req.json()
    lat = Number(body?.lat)
    lng = Number(body?.lng)
  } catch {
    // corpo inválido: cai na validação abaixo
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ liberado: false, uf: null, mensagem: "Localização inválida. Tente de novo." }, { status: 400, headers: NOINDEX })
  }

  // Não logamos a coordenada: é dado pessoal de quem acessa.
  const uf = ufPorCoordenada(lat, lng)
  if (!uf || !ESTADOS_LIBERADOS.includes(uf)) {
    return NextResponse.json({ liberado: false, uf, mensagem: MENSAGEM_REGIAO_BLOQUEADA }, { status: 200, headers: NOINDEX })
  }

  const res = NextResponse.json({ liberado: true, uf }, { status: 200, headers: NOINDEX })
  res.cookies.set(REGIAO_COOKIE, criarTokenRegiao(uf), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REGIAO_MAX_AGE,
  })
  return res
}
