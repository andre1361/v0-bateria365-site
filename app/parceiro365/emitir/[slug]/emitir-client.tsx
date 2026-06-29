"use client"

import { useState } from "react"
import { Certificate } from "@/app/parceiro365/certificate"
import { PrintStyles } from "@/app/parceiro365/print-styles"
import { logEmitCertificate } from "./actions"

const field: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  fontSize: 14,
  border: "1.5px solid #dde3ec",
  borderRadius: 11,
  marginBottom: 16,
  color: "#1f2733",
  background: "#fff",
}
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 6 }

export function EmitClient({ slug, distribuidor, cidade }: { slug: string; distribuidor: string; cidade: string }) {
  const [nome, setNome] = useState("")
  const [empresa, setEmpresa] = useState("")

  const baixar = () => {
    if (!nome.trim()) return
    logEmitCertificate(slug, nome, empresa).catch(() => {})
    setTimeout(() => window.print(), 300)
  }

  return (
    <div style={{ maxWidth: 1180, margin: "26px auto", padding: "0 22px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <PrintStyles />
      <section style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #e3e7ee", borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800 }}>Seu certificado</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6a7585" }}>
          Treinamento Bateria365 — {distribuidor}.
        </p>
        <label style={label}>Seu nome completo</label>
        <input className="pf365" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Oliveira" style={field} />
        <label style={label}>Empresa (opcional)</label>
        <input className="pf365" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" style={{ ...field, marginBottom: 22 }} />
        <button
          type="button"
          onClick={baixar}
          disabled={!nome.trim()}
          style={{
            width: "100%",
            height: 48,
            background: "#04377f",
            color: "#fff",
            border: "none",
            borderRadius: 11,
            fontSize: 15,
            fontWeight: 700,
            cursor: nome.trim() ? "pointer" : "not-allowed",
            opacity: nome.trim() ? 1 : 0.6,
          }}
        >
          ⬇ Baixar meu certificado
        </button>
      </section>

      <section style={{ flex: "2 1 460px", minWidth: 320 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 8px 30px rgba(16,33,60,0.08)", border: "1px solid #e3e7ee" }}>
          <Certificate nome={nome} distribuidor={distribuidor} cidade={cidade} />
        </div>
      </section>

      <div id="cert-print-area" aria-hidden style={{ position: "absolute", left: "-200vw", top: 0, width: "297mm" }}>
        <div className="cert-page" style={{ width: "297mm", height: "210mm", overflow: "hidden" }}>
          <Certificate nome={nome} distribuidor={distribuidor} cidade={cidade} style={{ width: "297mm", height: "210mm" }} />
        </div>
      </div>
    </div>
  )
}
