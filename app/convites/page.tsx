import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Lato, Montserrat } from "next/font/google"
import { CONVITES_COOKIE, getConvitesToken } from "./auth"
import { logoutConvites } from "./actions"
import { PasswordGate } from "./password-gate"
import { InviteEditor } from "./invite-editor"

// Fontes usadas pelas artes dos convites (self-hosted pelo next/font, mesma
// origem — garante render fiel e exportação de PNG sem problemas de CORS).
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["800"],
  style: ["italic"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Editor de Convites",
  // Área restrita: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false },
}

export default async function ConvitesPage() {
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get(CONVITES_COOKIE)?.value === getConvitesToken()

  return (
    <div className={`${lato.variable} ${montserrat.variable}`}>
      {isAuthed ? (
        <InviteEditor
          headerRight={
            <form action={logoutConvites}>
              <button
                type="submit"
                title="Encerrar sessão"
                style={{
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8a90a0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sair
              </button>
            </form>
          }
        />
      ) : (
        <PasswordGate />
      )}
    </div>
  )
}
