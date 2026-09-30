import type { Metadata } from "next"
import { cookies } from "next/headers"
import { REGIAO_COOKIE, ufLiberadaDoToken } from "@/lib/radio-code/regiao"
import { ConsultaClient } from "./consulta-client"
import { RegiaoGate } from "./regiao-gate"

export const metadata: Metadata = {
  title: "Consulta de código do rádio",
  description: "Recupere o código do rádio do veículo pela placa.",
  // Ferramenta interna: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function CodigoRadioPage() {
  // Só regiões que já receberam o Bateria 365: sem o cookie de região liberada, pede a localização.
  const liberado = ufLiberadaDoToken((await cookies()).get(REGIAO_COOKIE)?.value)
  return liberado ? <ConsultaClient /> : <RegiaoGate />
}
