// Ford: código do rádio calculado a partir da série "M" + 6 dígitos, 100% offline.
// A série "V" não tem algoritmo (só banco de dados) e não é calculada aqui.
// Fonte: github.com/OlegSmelov/ford-radio-codes.

export type ResultadoFord = { ok: true; codigo: string; serie: string } | { ok: false; erro: string }

const L = [
  [9, 5, 3, 4, 8, 7, 2, 6, 1, 0],
  [2, 1, 5, 6, 9, 3, 7, 0, 4, 8],
  [0, 4, 7, 3, 1, 9, 6, 5, 8, 2],
  [5, 6, 4, 1, 2, 8, 0, 9, 3, 7],
  [6, 3, 1, 2, 0, 5, 4, 8, 7, 9],
  [4, 0, 8, 7, 6, 1, 9, 3, 2, 5],
  [7, 8, 0, 5, 3, 2, 1, 4, 9, 6],
  [1, 9, 6, 8, 7, 4, 5, 2, 0, 3],
  [3, 2, 9, 0, 4, 6, 8, 7, 5, 1],
  [8, 7, 2, 9, 5, 0, 3, 1, 6, 4],
]

/** Mantém só letras/dígitos, em maiúsculas, no máximo 7 caracteres (para a máscara do input). */
export function mascararSerieFord(valor: string): string {
  return (valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7)
}

/** Normaliza para "M" + 6 dígitos; aceita só os 6 dígitos. Retorna "" se inválida. */
export function normalizarSerieFordM(valor: string): string {
  let s = mascararSerieFord(valor)
  if (/^\d{6}$/.test(s)) s = "M" + s
  return /^M\d{6}$/.test(s) ? s : ""
}

export function calcularCodigoFord(valor: string): ResultadoFord {
  const bruto = mascararSerieFord(valor)
  if (bruto.startsWith("V")) {
    return { ok: false, erro: "Rádios com série V não têm cálculo: o código só existe em banco de dados da Ford. Procure uma concessionária Ford com a série em mãos." }
  }
  const serie = normalizarSerieFordM(bruto)
  if (!serie) {
    return { ok: false, erro: "Série inválida. Ela tem a letra M e 6 números, ex.: M123456." }
  }

  const [n1, n2, n3, n4, n5, n6] = serie.slice(1).split("").map(Number).reverse()
  const n7 = 0
  const r1 = L[n1][5], r2 = L[n2][3], r3 = L[n3][8], r4 = L[n4][2]
  const r5 = L[n5][1], r6 = L[n6][6], r7 = L[n7][9]

  const res1 = ((L[r2][r1] + 1) * (L[r6][r2] + 1) + (L[r4][r3] + 1) * (L[r7][r5] + 1) + L[r1][r4]) % 10
  const res2 = ((L[r2][r1] + 1) * (L[r5][r4] + 1) + (L[r5][r2] + 1) * (L[r7][r3] + 1) + L[r1][r6]) % 10
  const res3 = ((L[r2][r1] + 1) * (L[r4][r2] + 1) + (L[r3][r6] + 1) * (L[r7][r4] + 1) + L[r1][r5]) % 10
  const res4 = ((L[r2][r1] + 1) * (L[r6][r3] + 1) + (L[r3][r7] + 1) * (L[r2][r5] + 1) + L[r4][r1]) % 10

  const xres1 = (L[res1][5] + 1) * (L[res2][1] + 1) + 105
  const xres2 = (L[res2][1] + 1) * (L[res4][0] + 1) + 102
  const xres3 = (L[res1][5] + 1) * (L[res3][8] + 1) + 103
  const xres4 = (L[res3][8] + 1) * (L[res4][0] + 1) + 108

  const code3 = ((Math.trunc(xres1 / 10) % 10) + (xres1 % 10) + r1) % 10
  const code2 = ((Math.trunc(xres2 / 10) % 10) + (xres2 % 10) + r1) % 10
  const code1 = ((Math.trunc(xres3 / 10) % 10) + (xres3 % 10) + r1) % 10
  const code0 = ((Math.trunc(xres4 / 10) % 10) + (xres4 % 10) + r1) % 10

  return { ok: true, codigo: `${code0}${code1}${code2}${code3}`, serie }
}
