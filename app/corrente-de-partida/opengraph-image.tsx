import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/card"

export const alt = "Corrente de partida — Bateria 365"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    titulo: "Corrente de partida",
    descricao: "Converta a corrente de partida entre SAE, EN, DIN, IEC, JIS e NBR e confira se a bateria serve no veículo.",
    rodape: "bateria365.com.br/corrente-de-partida",
  })
}
