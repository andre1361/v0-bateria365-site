import type { Metadata } from "next"
import { cookies } from "next/headers"
import { RegiaoGate } from "@/components/regiao-gate"
import { REGIAO_COOKIE, ufLiberadaDoToken } from "@/lib/radio-code/regiao"
import { ConversorClient } from "./conversor-client"

const TITULO = "Corrente de partida"
const DESCRICAO = "Converta a corrente de partida entre SAE, EN, DIN, IEC, JIS e NBR e confira se a bateria serve no veículo."

// Título, descrição e imagem próprios para a pré-visualização do link (a imagem vem de opengraph-image.tsx).
export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: { title: TITULO, description: DESCRICAO, url: "/corrente-de-partida", siteName: "Bateria 365", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: ["/corrente-de-partida/opengraph-image"] },
  // Ferramenta interna: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function CorrenteDePartidaPage() {
  // Mesma trava do código do rádio: só regiões que já receberam o Bateria 365. A UF também define o clima do parecer.
  const uf = ufLiberadaDoToken((await cookies()).get(REGIAO_COOKIE)?.value)
  return uf ? (
    <ConversorClient uf={uf} />
  ) : (
    <RegiaoGate
      titulo={TITULO}
      subtitulo="Converta entre normas e confira se a bateria serve."
      descricao="A ferramenta é liberada apenas para as regiões que já receberam o Bateria 365. Permita o acesso à localização para continuar."
    />
  )
}
