"use client"

import { InviteEditor, type InviteMeta } from "@/app/convites/invite-editor"
import { logInvite } from "./actions"

// Editor de convites embutido no portal (sem overlay) — preenche a área do
// módulo, mantendo sidebar e cabeçalho do Parceiro 365 visíveis.
export function InvitesClient() {
  return (
    <InviteEditor
      embedded
      onGenerated={(meta: InviteMeta) => {
        logInvite(meta).catch(() => {})
      }}
    />
  )
}
