"use client"

import { useActionState } from "react"
import { verificarChave, type ChaveState } from "./actions"

const initial: ChaveState = {}

export function PropostaGate({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(verificarChave, initial)
  return (
    <div style={{ maxWidth: 420, margin: "8vh auto 0", background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, boxShadow: "0 12px 40px rgba(16,33,60,0.10)", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#eef4fc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>🔒</div>
      <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Proposta protegida</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "#6a7585" }}>Informe a chave de acesso enviada pela equipe Bateria 365.</p>
      <form action={action}>
        <input type="hidden" name="slug" value={slug} />
        <input
          className="pf365"
          name="chave"
          aria-label="Chave de acesso"
          placeholder="Chave de acesso"
          autoComplete="off"
          autoCapitalize="characters"
          required
          style={{ width: "100%", height: 46, padding: "0 14px", fontSize: 16, letterSpacing: "0.12em", border: "1.5px solid #dde3ec", borderRadius: 11, color: "#1f2733", textAlign: "center" }}
        />
        {state.error && <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>{state.error}</div>}
        <button type="submit" disabled={pending} style={{ width: "100%", height: 46, marginTop: 18, background: "#04377f", color: "#fff", border: "none", borderRadius: 11, fontSize: 14.5, fontWeight: 700, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.75 : 1 }}>
          {pending ? "Verificando…" : "Ver proposta"}
        </button>
      </form>
    </div>
  )
}
