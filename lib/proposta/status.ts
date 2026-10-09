import { dataISONoBrasil, somarDiasISO } from "./formato"

export type StatusGravado = "rascunho" | "enviada" | "aceita" | "cancelada"
export type StatusEfetivo = StatusGravado | "expirada"

// "Expirada" não é gravada: é uma enviada cuja validade já passou.
export function statusEfetivo(status: StatusGravado, validaAte: Date | null, agora = new Date()): StatusEfetivo {
  if (status === "enviada" && validaAte && validaAte.getTime() <= agora.getTime()) return "expirada"
  return status
}

export function podeEditar(s: StatusEfetivo): boolean {
  return s === "rascunho" || s === "enviada" || s === "expirada"
}

export const ROTULO_STATUS: Record<StatusEfetivo, { texto: string; cor: string; fundo: string }> = {
  rascunho: { texto: "Rascunho", cor: "#41506a", fundo: "#eef1f6" },
  enviada: { texto: "Enviada", cor: "#04377f", fundo: "#e6effb" },
  expirada: { texto: "Expirada", cor: "#9a6700", fundo: "#fff7ed" },
  aceita: { texto: "Aceita", cor: "#1e7b3c", fundo: "#e7f6ec" },
  cancelada: { texto: "Cancelada", cor: "#b4232a", fundo: "#fdecec" },
}

export function calcularValidade(agora: Date, dias: number): Date {
  return new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)
}

// Fim do dia (23:59:59, São Paulo, UTC−3 fixo) de uma data ISO.
const fimDoDia = (iso: string): Date => new Date(`${iso}T23:59:59-03:00`)

// Validade efetiva: o menor entre "hoje + dias" e o dia anterior à ida, sempre até o
// fim do dia. Retorna null se esse limite já passou (viagem cedo demais).
export function validadeEfetiva(agora: Date, dias: number, idaISO: string): Date | null {
  const porDias = fimDoDia(somarDiasISO(dataISONoBrasil(agora), dias))
  const antesDaIda = fimDoDia(somarDiasISO(idaISO, -1))
  const v = porDias.getTime() <= antesDaIda.getTime() ? porDias : antesDaIda
  return v.getTime() > agora.getTime() ? v : null
}
