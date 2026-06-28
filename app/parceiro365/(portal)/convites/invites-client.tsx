"use client"

import { useState } from "react"
import { InviteEditor, type InviteMeta, type EditorState } from "@/app/convites/invite-editor"
import { logInvite } from "./actions"

type EventoLite = {
  id: string
  titulo: string
  template: string
  cidade: string
  dataISO: string
  horario: string
  local: string
}

// Editor de convites embutido no portal, com seletor para auto-preencher os
// dados a partir de um evento cadastrado.
export function InvitesClient({ eventos, distribuidorNome }: { eventos: EventoLite[]; distribuidorNome: string }) {
  const [eventId, setEventId] = useState("")
  const ev = eventos.find((e) => e.id === eventId)

  const initial: Partial<EditorState> | undefined = ev
    ? {
        template: ev.template === "vertical" ? "vertical" : "square",
        cidade: ev.cidade,
        dataISO: ev.dataISO || undefined,
        horario: ev.horario,
        local: ev.local,
        distribuidor: distribuidorNome,
      }
    : undefined

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {eventos.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #e6eaf1", background: "#fff" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#41506a", whiteSpace: "nowrap" }}>Preencher de um evento:</span>
          <select
            className="pf365"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#1f2733", background: "#fff", maxWidth: 360 }}
          >
            <option value="">— nenhum (em branco) —</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <InviteEditor
          key={eventId || "blank"}
          embedded
          initial={initial}
          onGenerated={(meta: InviteMeta) => {
            logInvite(meta).catch(() => {})
          }}
        />
      </div>
    </div>
  )
}
