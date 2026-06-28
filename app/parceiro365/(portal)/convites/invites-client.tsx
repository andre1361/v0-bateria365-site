"use client"

import { useState } from "react"
import { InviteEditor, type InviteMeta } from "@/app/convites/invite-editor"
import { logInvite } from "./actions"

export function InvitesClient() {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#fff" }}>
        <InviteEditor
          headerRight={
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#04377f",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Painel
            </button>
          }
          onGenerated={(meta: InviteMeta) => {
            // registra o convite gerado (não bloqueia o download)
            logInvite(meta).catch(() => {})
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "#eef4fc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          ✉️
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Gerador de convites</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#8a94a3" }}>
            Modelos de arte para eventos e treinamentos, prontos para baixar em PNG.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: "16px 18px",
          background: "#f5f8fc",
          border: "1px solid #e4ecf6",
          borderRadius: 12,
          fontSize: 13.5,
          color: "#41506a",
          lineHeight: 1.55,
        }}
      >
        Escolha o modelo (quadrado ou vertical), preencha os dados do evento e baixe a arte em alta resolução. Os
        convites gerados ficam registrados no seu painel.
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 18,
          height: 46,
          padding: "0 22px",
          background: "#04377f",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14.5,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(4,55,122,0.22)",
        }}
      >
        Abrir gerador de convites
      </button>
    </div>
  )
}
