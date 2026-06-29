"use client"

import { useActionState, useEffect, useState } from "react"
import { confirmAttendance, type RsvpState } from "./actions"
import { maskPhone } from "@/lib/phone"

const initial: RsvpState = {}
const field: React.CSSProperties = {
  width: "100%",
  height: 50,
  padding: "0 16px",
  fontSize: 15,
  border: "1.5px solid #dde3ec",
  borderRadius: 12,
  color: "#1f2733",
  background: "#fbfcfe",
  marginBottom: 12,
}

export function RsvpForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(confirmAttendance, initial)
  const [tel, setTel] = useState("")

  useEffect(() => {
    if (state.ok) {
      import("canvas-confetti")
        .then((m) => m.default({ particleCount: 150, spread: 85, origin: { y: 0.5 }, colors: ["#f9b801", "#04377f", "#ffffff", "#2a83ff"] }))
        .catch(() => {})
    }
  }, [state.ok])

  if (state.ok) {
    return (
      <div style={{ textAlign: "center", padding: "22px 8px" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 12px", borderRadius: "50%", background: "#eafaf0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#04377f" }}>Presença confirmada!</div>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6a7585", lineHeight: 1.5 }}>
          Tudo certo, <strong>{"te esperamos no treinamento"}</strong>. 💛
          <br />
          Em breve entraremos em contato pelo WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <form action={action}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "#1f2733" }}>Confirme sua presença</div>
      <p style={{ margin: "4px 0 16px", fontSize: 13.5, color: "#8a94a3" }}>Preencha seus dados para garantir seu lugar.</p>

      <input className="pf365" name="nome" placeholder="Seu nome completo *" required style={field} />
      <input
        className="pf365"
        name="telefone"
        type="tel"
        inputMode="numeric"
        value={tel}
        onChange={(e) => setTel(maskPhone(e.target.value))}
        placeholder="WhatsApp (DDD + número) *"
        required
        style={field}
      />
      <input className="pf365" name="email" type="email" placeholder="Seu e-mail" style={field} />
      <input className="pf365" name="empresa" placeholder="Sua empresa / loja" style={field} />

      {state.error && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          height: 54,
          background: "linear-gradient(180deg,#0a4a96,#04377f)",
          color: "#fff",
          border: "none",
          borderRadius: 13,
          fontSize: 16,
          fontWeight: 800,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.8 : 1,
          boxShadow: "0 10px 24px -8px rgba(4,55,122,0.6)",
        }}
      >
        {pending ? "Confirmando…" : "Confirmar presença"}
      </button>
    </form>
  )
}
