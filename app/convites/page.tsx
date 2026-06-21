import type { Metadata } from "next"
import { cookies } from "next/headers"
import { LogOut } from "lucide-react"
import { CONVITES_COOKIE, getConvitesToken } from "./auth"
import { logoutConvites } from "./actions"
import { PasswordGate } from "./password-gate"
import { InviteEditor } from "./invite-editor"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Editor de Convites",
  // Área restrita: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false },
}

export default async function ConvitesPage() {
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get(CONVITES_COOKIE)?.value === getConvitesToken()

  if (!isAuthed) {
    return <PasswordGate />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-primary px-4 py-3 text-white sm:px-6">
        <span className="font-bold">Editor de Convites</span>
        <form action={logoutConvites}>
          <Button
            type="submit"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </form>
      </header>

      <main>
        <InviteEditor />
      </main>
    </div>
  )
}
