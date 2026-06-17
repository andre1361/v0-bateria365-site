import type React from "react"
import "./globals.css"
import { Inter, Exo_2 } from "next/font/google"
import type { Metadata } from "next" // Importe Metadata
import { SuppressResizeObserver } from "./suppress-resize-observer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  weight: ["400", "700"],
  display: "swap",
})

// Adicione o objeto metadata para SEO
export const metadata: Metadata = {
  metadataBase: new URL("https://bateria365.com.br"), // Substitua pelo seu domínio real
  title: {
    default: "Bateria 365 | Transforme seus Lojistas em Especialistas",
    template: "%s | Bateria 365",
  },
  description:
    "O Bateria 365 é o treinamento completo para distribuidores e lojistas de baterias, capacitando equipes técnica, comercial e digitalmente para a nova era automotiva.",
  keywords: [
    "Bateria 365",
    "treinamento baterias",
    "especialistas automotivos",
    "mercado automotivo",
    "capacitação lojistas",
    "baterias automotivas",
    "Moura",
    "Rodmaster",
    "Distribuidor Norte",
  ],
  openGraph: {
    title: "Bateria 365 | Transforme seus Lojistas em Especialistas",
    description:
      "Capacite sua rede de lojistas de baterias com o treinamento Bateria 365 e torne-se referência nacional.",
    url: "https://bateria365.com.br", // Substitua pelo seu domínio real
    siteName: "Bateria 365",
    images: [
      {
        url: "/images/especialistas.webp", // Nova imagem para Open Graph
        width: 800, // Largura da imagem
        height: 600, // Altura da imagem
        alt: "Especialistas Bateria 365",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bateria 365 | Transforme seus Lojistas em Especialistas",
    description:
      "Capacite sua rede de lojistas de baterias com o treinamento Bateria 365 e torne-se referência nacional.",
    images: ["/images/especialistas.webp"], // Nova imagem para Twitter Card
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Adicione outros metadados conforme necessário, como canonical, alternativos, etc.
  generator: "v0.dev", // Propriedade 'generator' adicionada e formatada corretamente
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${exo2.variable}`}>
      <body>
        <SuppressResizeObserver />
        {children}
      </body>
    </html>
  )
}
