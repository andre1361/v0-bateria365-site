// Renault/Dacia: código do rádio calculado a partir do precode (1 letra + 3 dígitos),
// 100% offline. Precodes iniciados em "A0" não são suportados pelo algoritmo.
// Fonte: github.com/m-a-x-s-e-e-l-i-g/renault-radio-code-generator (MIT).

export type ResultadoPrecode = { ok: true; codigo: string; precode: string } | { ok: false; erro: string }

/** Mantém só letras/dígitos, em maiúsculas, no máximo 4 caracteres (para a máscara do input). */
export function mascararPrecode(valor: string): string {
  return (valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)
}

export function precodeValido(precode: string): boolean {
  return /^[A-Z]\d{3}$/.test(precode)
}

export function calcularCodigoRenaultPrecode(valor: string): ResultadoPrecode {
  const p = mascararPrecode(valor)
  if (!precodeValido(p)) {
    return { ok: false, erro: "Precode inválido. Ele tem 1 letra e 3 números, ex.: A123." }
  }
  if (p.startsWith("A0")) {
    return { ok: false, erro: "Precodes que começam com A0 não podem ser calculados aqui. Nesse caso, consulte pela placa ou ligue para o SAC da Renault." }
  }
  const x = p.charCodeAt(1) + p.charCodeAt(0) * 10 - 698
  const y = p.charCodeAt(3) + p.charCodeAt(2) * 10 + x - 528
  const z = (y * 7) % 100
  const code = Math.floor(z / 10) + (z % 10) * 10 + ((259 % x) % 100) * 100
  return { ok: true, codigo: String(code).padStart(4, "0"), precode: p }
}
