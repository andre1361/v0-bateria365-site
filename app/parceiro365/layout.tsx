import type { Metadata } from "next"
import type React from "react"
import { Manrope, PT_Serif, PT_Sans, Lato, Montserrat } from "next/font/google"

// Fontes do portal (Manrope) + certificado (PT Serif/PT Sans) + editor de
// convites embutido (Lato/Montserrat). Self-hosted via next/font.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })
const ptSerif = PT_Serif({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-pt-serif", display: "swap" })
const ptSans = PT_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-pt-sans", display: "swap" })
const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-lato", display: "swap" })
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["800"],
  style: ["italic"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Parceiro 365", template: "%s · Parceiro 365" },
  robots: { index: false, follow: false },
}

export default function Parceiro365Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${manrope.variable} ${ptSerif.variable} ${ptSans.variable} ${lato.variable} ${montserrat.variable}`}
      style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
    >
      {children}
    </div>
  )
}
