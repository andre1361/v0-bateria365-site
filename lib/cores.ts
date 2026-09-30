// Utilitários de cor e iniciais usados pela página de links e pela imagem de pré-visualização dela.

export function iniciais(nome: string) {
  return (nome || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
}

export function normHex(hex: string) {
  const h = (hex || "").replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
export function rgba(hex: string, a: number) {
  const c = normHex(hex)
  return c ? `rgba(${c.r},${c.g},${c.b},${a})` : `rgba(4,55,122,${a})`
}
// Preto ou branco conforme a luminância — mantém contraste sobre a cor de destaque.
export function readableOn(hex: string) {
  const c = normHex(hex)
  if (!c) return "#ffffff"
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
  return L > 0.52 ? "#16202f" : "#ffffff"
}
