"use client"

import { useActionState } from "react"
import { confirmAttendance, type RsvpState } from "./actions"

const initial: RsvpState = {}
const field: React.CSSProperties = {
  width: "100%",
  height: 48,
  padding: "0 14px",
  fontSize: 15,
  border: "1.5px solid #dde3ec",
  borderRadius: 12,
  color: "#1f2733",
  background: "#fff",
  marginBottom: 12,
}

export function RsvpForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(confirmAttendance, initial)

  if (state.ok) {
    return (
      <div style={{ textAlign: "center", padding: "18px 8px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#04377f" }}>Presença confirmada!</div>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#6a7585" }}>Te esperamos no evento. 💛</p>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2733", marginBottom: 12 }}>Confirme sua presença</div>
      <input className="pf365" name="nome" placeholder="Seu nome completo" required style={field} />
      <input className="pf365" name="telefone" type="tel" placeholder="WhatsApp (DDD + número)" required style={field} />
      {state.error && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          height: 50,
          background: "#04377f",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15.5,
          fontWeight: 800,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.75 : 1,
          boxShadow: "0 8px 20px -8px rgba(4,55,122,0.6)",
        }}
      >
        {pending ? "Confirmando…" : "Confirmar presença"}
      </button>
    </form>
  )
}
