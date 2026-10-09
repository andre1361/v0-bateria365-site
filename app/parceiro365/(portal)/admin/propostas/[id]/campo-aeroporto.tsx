"use client"

import { useState } from "react"
import { aeroportoPorIata, buscarAeroportos } from "@/lib/proposta/aeroportos"
import { field } from "../estilos"

export function CampoAeroporto({ id, valor, onChange, disabled }: { id: string; valor: string; onChange: (iata: string) => void; disabled?: boolean }) {
  const sel = valor ? aeroportoPorIata(valor) : undefined
  // null = mostrando o aeroporto escolhido; string = o admin está digitando.
  const [q, setQ] = useState<string | null>(null)
  const opcoes = q ? buscarAeroportos(q) : []
  const rotulo = sel ? `${sel.cidade}/${sel.uf} (${sel.iata}) — ${sel.nome}` : ""

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        className="pf365"
        role="combobox"
        aria-expanded={opcoes.length > 0}
        aria-controls={`${id}-lista`}
        autoComplete="off"
        disabled={disabled}
        placeholder="Digite a cidade ou o código (ex.: Salvador, SSA)"
        value={q ?? rotulo}
        onFocus={() => setQ("")}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setQ(null)}
        style={field}
      />
      {opcoes.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 20, margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid #dde3ec", borderRadius: 10, boxShadow: "0 12px 30px rgba(16,33,60,0.12)" }}
        >
          {opcoes.map((a) => (
            <li key={a.iata} role="option" aria-selected={a.iata === valor}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(a.iata)
                  setQ(null)
                }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", minHeight: 44, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: "#1f2733" }}
              >
                {a.cidade}/{a.uf} <strong>{a.iata}</strong> <span style={{ color: "#8792a2", fontSize: 12 }}>{a.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
