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
