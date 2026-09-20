import type { Metadata } from "next"
import { ConsultaClient } from "./consulta-client"

export const metadata: Metadata = {
  title: "Consulta de código do rádio",
  description: "Recupere o código do rádio do veículo pela placa.",
  // Ferramenta interna: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function CodigoRadioPage() {
  return <ConsultaClient />
}
