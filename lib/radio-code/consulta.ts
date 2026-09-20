// Lógica de negócio: normaliza, valida, consulta e faz fallback para o outro
// formato de placa (Mercosul <-> antiga). Independente do transporte HTTP.
import { converterPlaca, detectarFormato, formatarPlaca, normalizarPlaca, placaValida, type FormatoPlaca } from "./placa"
import { consultarRenault, type RespostaRenault } from "./renault"

export type Tentativa = {
  placa: string
  formato: FormatoPlaca
  status: number
  achou: boolean
  mensagem: string
}

export type ResultadoConsulta =
  | { ok: true; codigo: string; placa_consultada: string; formato: FormatoPlaca; fallback: boolean; tentativas: Tentativa[] }
  | { ok: false; erro: string; tentativas: Tentativa[] }

export type Consultor = (placa: string) => Promise<RespostaRenault>

const MSG_NAO_ENCONTRADO = "Código não encontrado em nenhum dos formatos de placa."
const MSG_INDISPONIVEL = "O serviço da Renault não respondeu. Tente novamente em alguns minutos."

function achou(r: RespostaRenault) {
  return r.status === 200 && !!r.code
}

function mensagemDe(r: RespostaRenault) {
  if (r.details?.length) return r.details.join(" ")
  return r.message || (r.status === 0 ? "Sem resposta" : `HTTP ${r.status}`)
}

export async function consultarCodigoRadio(placaBruta: string, consultar: Consultor = consultarRenault): Promise<ResultadoConsulta> {
  const placa = normalizarPlaca(placaBruta)
  if (!placaValida(placa)) {
    return { ok: false, erro: "Placa inválida. Informe 7 caracteres, ex.: AXU-9B03 ou AXU-9103.", tentativas: [] }
  }

  const tentativas: Tentativa[] = []
  const candidatas = [placa]
  const convertida = converterPlaca(placa)
  if (convertida && convertida !== placa) candidatas.push(convertida)

  for (const [i, cand] of candidatas.entries()) {
    let resposta: RespostaRenault
    try {
      resposta = await consultar(cand)
    } catch {
      tentativas.push({ placa: formatarPlaca(cand), formato: detectarFormato(cand), status: 0, achou: false, mensagem: "Sem resposta (timeout ou serviço fora do ar)" })
      return { ok: false, erro: MSG_INDISPONIVEL, tentativas }
    }

    const ok = achou(resposta)
    tentativas.push({ placa: formatarPlaca(cand), formato: detectarFormato(cand), status: resposta.status, achou: ok, mensagem: mensagemDe(resposta) })

    if (ok) {
      return { ok: true, codigo: String(resposta.code), placa_consultada: formatarPlaca(cand), formato: detectarFormato(cand), fallback: i > 0, tentativas }
    }
    // 422 = placa rejeitada pela Renault; converter não vai ajudar.
    if (resposta.status === 422) {
      return { ok: false, erro: "A Renault não aceitou essa placa. Confira se digitou certo e tente de novo.", tentativas }
    }
  }

  return { ok: false, erro: MSG_NAO_ENCONTRADO, tentativas }
}
