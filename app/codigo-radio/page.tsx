import type { Metadata } from "next"
import { cookies } from "next/headers"
import { REGIAO_COOKIE, ufLiberadaDoToken } from "@/lib/radio-code/regiao"
import { ConsultaClient } from "./consulta-client"
import { RegiaoGate } from "@/components/regiao-gate"

const TITULO = "Código do rádio"
const DESCRICAO = "Trocou a bateria e o rádio pediu código? Recupere o código de desbloqueio do rádio pela placa do veículo."

// Título, descrição e imagem próprios para a pré-visualização do link (a imagem vem de opengraph-image.tsx).
export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: { title: TITULO, description: DESCRICAO, url: "/codigo-radio", siteName: "Bateria 365", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: ["/codigo-radio/opengraph-image"] },
  // Ferramenta interna: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function CodigoRadioPage() {
  // Só regiões que já receberam o Bateria 365: sem o cookie de região liberada, pede a localização.
  const liberado = ufLiberadaDoToken((await cookies()).get(REGIAO_COOKIE)?.value)
  return liberado ? (
    <ConsultaClient />
  ) : (
    <RegiaoGate
      titulo="Código do rádio"
      subtitulo="Recupere o código de desbloqueio do rádio."
      descricao="A consulta é liberada apenas para as regiões que já receberam o Bateria 365. Permita o acesso à localização para continuar."
    />
  )
}
