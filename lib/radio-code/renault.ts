// Cliente do serviço público da Renault para consulta do código do rádio por placa.
// Endpoint aberto (sem token/CAPTCHA), porta 8083 obrigatória, sem CORS — por isso
// só pode ser chamado do servidor.
import https from "node:https"

const ENDPOINT = "https://radio-code.renault.com.br:8083/radio/code"
const TIMEOUT_MS = 25_000

export type RespostaRenault = {
  status: number
  plate?: string
  message?: string
  code?: string | null
  details?: string[]
}

type Resultado = { status: number; body: string }

// Código de erro TLS típico de cadeia incompleta — só nesse caso relaxamos a
// verificação, e apenas nesta chamada.
const ERROS_TLS = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_GET_ISSUER_CERT",
  "CERT_HAS_EXPIRED",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ERR_TLS_CERT_ALTNAME_INVALID",
])

async function viaFetch(payload: string): Promise<Resultado> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: payload,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return { status: res.status, body: await res.text() }
}

function viaHttpsInseguro(payload: string): Promise<Resultado> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (c: Buffer) => chunks.push(c))
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }))
      },
    )
    req.on("timeout", () => req.destroy(new Error("timeout")))
    req.on("error", reject)
    req.end(payload)
  })
}

function codigoErro(err: unknown): string {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.cause?.code || e?.code || ""
}

/** Faz o POST na Renault. Lança erro em timeout/indisponibilidade. */
export async function consultarRenault(placa: string): Promise<RespostaRenault> {
  const payload = JSON.stringify({ plate: placa })
  let resultado: Resultado
  try {
    resultado = await viaFetch(payload)
  } catch (err) {
    if (!ERROS_TLS.has(codigoErro(err))) throw err
    resultado = await viaHttpsInseguro(payload)
  }

  let dados: Partial<RespostaRenault> = {}
  try {
    dados = JSON.parse(resultado.body)
  } catch {
    // corpo não-JSON (ex.: página de erro do gateway) — tratamos como falha
  }
  return { status: resultado.status, ...dados }
}
