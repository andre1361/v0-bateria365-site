"use client"

import { useEffect, useState } from "react"
import { dataISONoBrasil, formatarDataISO } from "@/lib/proposta/formato"
import { botaoSecundario, card } from "../estilos"

export function LinkGerado({ slug, chave, validaAte, distribuidor, cidade, dataInicioISO }: { slug: string; chave: string; validaAte: string | null; distribuidor: string; cidade: string; dataInicioISO: string }) {
  const [origin, setOrigin] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)
  useEffect(() => setOrigin(window.location.origin), [])

  const url = `${origin}/parceiro365/proposta/${slug}`
  const validade = validaAte ? formatarDataISO(dataISONoBrasil(new Date(validaAte))) : ""
  const mensagem = [
    `Olá, ${distribuidor}! Segue a proposta do Treinamento Bateria 365${cidade ? ` em ${cidade}` : ""}${dataInicioISO ? ` (${formatarDataISO(dataInicioISO)})` : ""}.`,
    `Acesse: ${url}`,
    `Chave de acesso: ${chave}`,
    validade ? `Válida até ${validade}.` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const copiar = (rotulo: string, texto: string) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(rotulo)
    setTimeout(() => setCopiado((c) => (c === rotulo ? null : c)), 1800)
  }

  return (
    <section style={{ ...card, borderColor: "#c9d6ea", background: "#f7faff" }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Link da proposta</h2>
      <p style={{ margin: "0 0 6px", fontSize: 13, wordBreak: "break-all" }}>{url}</p>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>
        Chave de acesso: <strong style={{ letterSpacing: "0.12em" }}>{chave}</strong>
      </p>
      {validade && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#6a7585" }}>Válida até {validade}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={botaoSecundario} onClick={() => copiar("link", url)}>
          {copiado === "link" ? "Copiado!" : "Copiar link"}
        </button>
        <button type="button" style={botaoSecundario} onClick={() => copiar("chave", chave)}>
          {copiado === "chave" ? "Copiada!" : "Copiar chave"}
        </button>
        <button type="button" style={botaoSecundario} onClick={() => copiar("msg", mensagem)}>
          {copiado === "msg" ? "Copiada!" : "Copiar mensagem para WhatsApp"}
        </button>
      </div>
    </section>
  )
}
