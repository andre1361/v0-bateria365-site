// Máscara de telefone brasileiro: (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo).
export function maskPhone(value: string): string {
  const v = (value || "").replace(/\D/g, "").slice(0, 11)
  if (!v) return ""
  if (v.length <= 2) return `(${v}`
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
}

// Telefone no formato do wa.me: só dígitos, com DDI 55 quando vier só DDD + número.
export function whatsappPhone(value: string): string {
  const digits = (value || "").replace(/\D/g, "")
  return digits.length === 10 || digits.length === 11 ? "55" + digits : digits
}
