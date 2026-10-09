"use client"

import { useState } from "react"
import { aeroportoPorIata, buscarAeroportos } from "@/lib/proposta/aeroportos"
import { field } from "../estilos"

export function CampoAeroporto({ id, valor, onChange, disabled }: { id: string; valor: string; onChange: (iata: string) => void; disabled?: boolean }) {
  const sel = valor ? aeroportoPorIata(valor) : undefined
  // null = mostrando o aeroporto escolhido; string = o admin está digitando.
  const [q, setQ] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(0)
  const opcoes = q ? buscarAeroportos(q) : []
  const idxAtivo = Math.min(ativo, Math.max(opcoes.length - 1, 0))
  const rotulo = sel ? `${sel.cidade}/${sel.uf} (${sel.iata}) — ${sel.nome}` : ""

  const escolher = (iata: string) => {
    onChange(iata)
    setQ(null)
    setAtivo(0)
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        className="pf365"
        role="combobox"
        aria-expanded={opcoes.length > 0}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={opcoes.length ? `${id}-opt-${opcoes[idxAtivo].iata}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder="Digite a cidade ou o código (ex.: Salvador, SSA)"
        value={q ?? rotulo}
        onFocus={() => setQ("")}
        onChange={(e) => {
          setQ(e.target.value)
          setAtivo(0)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && opcoes.length) {
            e.preventDefault()
            setAtivo((idxAtivo + 1) % opcoes.length)
          } else if (e.key === "ArrowUp" && opcoes.length) {
            e.preventDefault()
            setAtivo((idxAtivo - 1 + opcoes.length) % opcoes.length)
          } else if (e.key === "Enter" && opcoes.length) {
            e.preventDefault()
            escolher(opcoes[idxAtivo].iata)
          } else if (e.key === "Escape") {
            setQ(null)
          }
        }}
        onBlur={() => setQ(null)}
        style={field}
      />
      {opcoes.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 20, margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid #dde3ec", borderRadius: 10, boxShadow: "0 12px 30px rgba(16,33,60,0.12)" }}
        >
          {opcoes.map((a, i) => (
            <li
              key={a.iata}
              id={`${id}-opt-${a.iata}`}
              role="option"
              aria-selected={i === idxAtivo}
              onMouseDown={(e) => {
                e.preventDefault()
                escolher(a.iata)
              }}
              style={{ display: "block", padding: "9px 10px", minHeight: 44, boxSizing: "border-box", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: "#1f2733", background: i === idxAtivo ? "#eef3fb" : "transparent" }}
            >
              {a.cidade}/{a.uf} <strong>{a.iata}</strong> <span style={{ color: "#8792a2", fontSize: 12 }}>{a.nome}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
