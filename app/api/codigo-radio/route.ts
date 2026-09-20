// Proxy interno: o navegador fala só com esta rota, que consulta a Renault no
// servidor (o endpoint deles não libera CORS). Contrato: POST { placa } ->
// { ok, codigo, placa_consultada, formato, fallback, tentativas } | { ok:false, erro, tentativas }.
import { type NextRequest, NextResponse } from "next/server"
import { consultarCodigoRadio } from "@/lib/radio-code/consulta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// A porta 8083 da Renault às vezes demora; timeout externo é 25s (x2 no fallback).
export const maxDuration = 60

// Rate limit simples por IP (melhor esforço: memória por instância serverless).
const JANELA_MS = 60_000
const MAX_POR_JANELA = 10
const historico = new Map<string, number[]>()

function excedeuLimite(ip: string) {
  const agora = Date.now()
  const recentes = (historico.get(ip) ?? []).filter((t) => agora - t < JANELA_MS)
  if (recentes.length >= MAX_POR_JANELA) {
    historico.set(ip, recentes)
    return true
  }
  recentes.push(agora)
  historico.set(ip, recentes)
  // Evita crescer sem limite.
  if (historico.size > 5000) {
    for (const [k, v] of historico) if (v.every((t) => agora - t >= JANELA_MS)) historico.delete(k)
  }
  return false
}

function ipDe(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconhecido"
}

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" }

export async function POST(req: NextRequest) {
  if (excedeuLimite(ipDe(req))) {
    return NextResponse.json(
      { ok: false, erro: "Muitas consultas em pouco tempo. Aguarde um minuto e tente de novo.", tentativas: [] },
      { status: 429, headers: NOINDEX },
    )
  }

  let placa = ""
  try {
    const body = await req.json()
    placa = typeof body?.placa === "string" ? body.placa : ""
  } catch {
    // corpo inválido: cai na validação abaixo
  }
  if (!placa.trim()) {
    return NextResponse.json({ ok: false, erro: "Informe a placa do veículo.", tentativas: [] }, { status: 400, headers: NOINDEX })
  }

  const resultado = await consultarCodigoRadio(placa)
  // Não logamos a placa: é dado do veículo de terceiro.
  return NextResponse.json(resultado, { status: 200, headers: NOINDEX })
}
