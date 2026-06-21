import { Construction } from "lucide-react"

// PLACEHOLDER — substituir pelo design "Editor de Convites.dc.html",
// importado do Claude Design via conector claude_design (após /design-login).
// O design é um bundle HTML/CSS/JS autocontido que será convertido para
// React/Next.js e renderizado aqui dentro.
export function InviteEditor() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-primary">Editor de Convites</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Acesso liberado. O editor de convites será carregado aqui assim que o design for importado do Claude Design.
        </p>
      </div>
    </div>
  )
}
