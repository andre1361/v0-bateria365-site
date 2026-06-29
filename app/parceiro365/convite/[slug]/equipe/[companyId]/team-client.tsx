"use client"

import { useActionState, useEffect, useState } from "react"
import { registerTeam, type TeamState } from "./actions"
import { maskPhone } from "@/lib/phone"

type Row = { nome: string; telefone: string; email: string }
const EMPTY: Row = { nome: "", telefone: "", email: "" }
const initial: TeamState = {}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  fontSize: 14.5,
  border: "1.5px solid #dde3ec",
  borderRadius: 10,
  color: "#1f2733",
  background: "#fff",
  marginBottom: 8,
}

export function TeamClient({
  slug,
  companyId,
  companyNome,
  meta,
  jaCount,
}: {
  slug: string
  companyId: string
  companyNome: string
  meta: number
  jaCount: number
}) {
  const [state, action, pending] = useActionState(registerTeam, initial)
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }])

  useEffect(() => {
    if (state.ok && (state.added ?? 0) > 0) {
      import("canvas-confetti")
        .then((m) => m.default({ particleCount: 160, spread: 90, origin: { y: 0.5 }, colors: ["#f9b801", "#04377f", "#ffffff", "#2a83ff"] }))
        .catch(() => {})
    }
  }, [state])

  const validRows = rows
    .map((r) => ({ nome: r.nome.trim(), telefone: r.telefone.trim(), email: r.email.trim() }))
    .filter((r) => r.nome)

  const setRow = (i: number, k: keyof Row, v: string) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)))
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY }])
  const removeRow = (i: number) => setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))

  if (state.ok) {
    return (
      <div style={{ textAlign: "center", padding: "20px 8px" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 12px", borderRadius: "50%", background: "#eafaf0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#04377f" }}>{(state.added ?? 0) > 0 ? `${state.added} funcionário(s) adicionado(s)!` : "Tudo certo!"}</div>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6a7585", lineHeight: 1.5 }}>
          {(state.skipped ?? 0) > 0 ? `${state.skipped} já estavam na lista e foram ignorados. ` : ""}
          A equipe da <strong>{companyNome}</strong> está confirmada. 💛
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: 18, height: 48, padding: "0 22px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
        >
          Adicionar mais funcionários
        </button>
      </div>
    )
  }

  const restante = meta > 0 ? Math.max(0, meta - jaCount) : 0

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="people" value={JSON.stringify(validRows)} />

      <div style={{ fontSize: 17, fontWeight: 800, color: "#1f2733" }}>Cadastre sua equipe</div>
      <p style={{ margin: "4px 0 16px", fontSize: 13.5, color: "#8a94a3" }}>
        Adicione os funcionários da <strong style={{ color: "#6a7585" }}>{companyNome}</strong> que vão participar do treinamento.
        {meta > 0
          ? ` ${jaCount}/${meta} já cadastrados${restante > 0 ? ` · faltam ${restante}` : " · meta atingida"}.`
          : jaCount > 0
            ? ` ${jaCount} já cadastrados.`
            : ""}
      </p>

      {rows.map((r, i) => (
        <div key={i} style={{ border: "1px solid #eef1f5", borderRadius: 12, padding: 12, marginBottom: 10, background: "#fbfcfe" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#9298a6" }}>Funcionário {i + 1}</span>
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(i)} style={{ background: "none", border: "none", color: "#c0392b", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                Remover
              </button>
            )}
          </div>
          <input className="pf365" value={r.nome} onChange={(e) => setRow(i, "nome", e.target.value)} placeholder="Nome completo *" style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="pf365"
              value={r.telefone}
              onChange={(e) => setRow(i, "telefone", maskPhone(e.target.value))}
              inputMode="numeric"
              placeholder="WhatsApp"
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
            />
            <input className="pf365" value={r.email} onChange={(e) => setRow(i, "email", e.target.value)} type="email" placeholder="E-mail" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        style={{ width: "100%", height: 44, marginBottom: 14, background: "#fff", color: "#04377f", border: "1.8px dashed #c3cedd", borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
      >
        + Adicionar outro funcionário
      </button>

      {state.error && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}

      <button
        type="submit"
        disabled={pending || !validRows.length}
        style={{
          width: "100%",
          height: 54,
          background: "linear-gradient(180deg,#0a4a96,#04377f)",
          color: "#fff",
          border: "none",
          borderRadius: 13,
          fontSize: 16,
          fontWeight: 800,
          cursor: pending || !validRows.length ? "not-allowed" : "pointer",
          opacity: pending || !validRows.length ? 0.7 : 1,
          boxShadow: "0 10px 24px -8px rgba(4,55,122,0.6)",
        }}
      >
        {pending ? "Enviando…" : `Confirmar ${validRows.length || ""} funcionário(s)`.replace("  ", " ")}
      </button>
    </form>
  )
}
