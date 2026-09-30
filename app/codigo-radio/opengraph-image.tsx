import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/card"

export const alt = "Código do rádio — Bateria 365"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    titulo: "Código do rádio",
    descricao: "Trocou a bateria e o rádio pediu código? Recupere o código de desbloqueio pela placa do veículo.",
    rodape: "bateria365.com.br/codigo-radio",
  })
}
