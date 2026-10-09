"use client"

import { useState } from "react"
import type { VooEscolhido } from "@/lib/proposta/calculo"
import { formatarBRL, formatarDuracao, formatarValorCampo, parseBRL } from "@/lib/proposta/formato"
import type { OpcaoVoo, ResultadoBusca } from "@/lib/proposta/serpapi"
import { field } from "../estilos"

const hora = (dt?: string) => (dt ? dt.slice(11, 16) : "")
const escalas = (n?: number) => (n ? `${n} escala${n > 1 ? "s" : ""}` : "direto")
const mesmoVoo = (v: VooEscolhido | undefined, o: OpcaoVoo) => v?.modo === "serpapi" && v.preco === o.preco && v.partida === o.partida

export function ColunaVoos({
  origem,
  local,
  resultado,
  escolhido,
  editavel,
  onEscolher,
}: {
  origem: { id: string; cidade: string; iata: string }
  local: boolean
  resultado?: ResultadoBusca
  escolhido?: VooEscolhido
  editavel: boolean
  onEscolher: (v: VooEscolhido | undefined) => void
}) {
  const [texto, setTexto] = useState(escolhido?.modo === "manual" ? formatarValorCampo(escolhido.preco) : "")
  const manual = escolhido?.modo === "manual"
  const invalido = manual && texto !== "" && parseBRL(texto) === null
  const grupo = `voo-${origem.id}`

  return (
    <div style={{ flex: "1 1 260px", border: "1px solid #e6eaf1", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>
        {origem.cidade} ({origem.iata})
      </div>

      {local ? (
        <p style={{ margin: 0, fontSize: 13, color: "#6a7585" }}>Treinamento na cidade do instrutor — sem passagem.</p>
      ) : (
        <>
          {resultado && !resultado.ok && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{resultado.erro}</p>}
          {resultado?.ok && resultado.doCache && <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "#8792a2" }}>Resultado guardado das últimas 6h.</p>}

          {resultado?.ok &&
            resultado.opcoes.map((o) => (
              <label key={`${o.partida}-${o.preco}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", minHeight: 44, marginBottom: 6, border: `1.5px solid ${mesmoVoo(escolhido, o) ? "#04377f" : "#e6eaf1"}`, borderRadius: 10, cursor: editavel ? "pointer" : "default", fontSize: 13 }}>
                <input type="radio" name={grupo} disabled={!editavel} checked={mesmoVoo(escolhido, o)} onChange={() => onEscolher({ modo: "serpapi", ...o })} />
                <span style={{ flex: 1 }}>
                  <strong>{o.companhia}</strong> · {hora(o.partida)}→{hora(o.chegada)} · {formatarDuracao(o.duracaoMin)} · {escalas(o.escalas)}
                </span>
                <strong>{formatarBRL(o.preco)}</strong>
              </label>
            ))}

          {!resultado && escolhido?.modo === "serpapi" && (
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>
              Escolhido: <strong>{escolhido.companhia}</strong> · {hora(escolhido.partida)}→{hora(escolhido.chegada)} · {escalas(escolhido.escalas)} ·{" "}
              <strong>{formatarBRL(escolhido.preco)}</strong>
            </p>
          )}

          <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44, fontSize: 13, cursor: editavel ? "pointer" : "default" }}>
            <input type="radio" name={grupo} disabled={!editavel} checked={manual} onChange={() => onEscolher({ modo: "manual", preco: parseBRL(texto) ?? 0 })} />
            Usar valor manual (ida e volta)
          </label>
          {manual && (
            <input
              className="pf365"
              aria-label={`Valor manual da passagem de ${origem.cidade}`}
              inputMode="decimal"
              placeholder="Ex.: 1.500,00"
              disabled={!editavel}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                onEscolher({ modo: "manual", preco: parseBRL(e.target.value) ?? 0 })
              }}
              style={{ ...field, marginBottom: 0, borderColor: invalido ? "#d6442f" : "#dde3ec" }}
            />
          )}
        </>
      )}
    </div>
  )
}
