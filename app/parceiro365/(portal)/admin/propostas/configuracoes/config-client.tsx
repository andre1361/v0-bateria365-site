"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { Parametros } from "@/lib/proposta/calculo"
import { formatarPercentual, formatarValorCampo } from "@/lib/proposta/formato"
import { salvarConfiguracoes, type ConfigState } from "../actions"
import { botaoPrimario, botaoSecundario, card, field, label } from "../estilos"

const initial: ConfigState = {}

const CAMPOS: { nome: keyof Omit<Parametros, "acrescimoPct">; rotulo: string; ajuda: string }[] = [
  { nome: "hotelDiaria", rotulo: "Hotel — diária por pessoa (R$)", ajuda: "Multiplicada pelas diárias e pelas 2 pessoas." },
  { nome: "alimentacaoDia", rotulo: "Alimentação — por dia, por pessoa (R$)", ajuda: "Multiplicada pelos dias de viagem e pelas 2 pessoas." },
  { nome: "uberFixo", rotulo: "Uber — fixo por proposta (R$)", ajuda: "Valor único para a dupla." },
  { nome: "honorario", rotulo: "Honorário do treinamento (R$)", ajuda: "Valor fixo por treinamento." },
]

export function ConfigClient({ parametros, validadeDias }: { parametros: Parametros; validadeDias: number }) {
  const [state, action, pending] = useActionState(salvarConfiguracoes, initial)
  return (
    <form action={action} style={{ ...card, maxWidth: 520 }}>
      {CAMPOS.map((c) => (
        <div key={c.nome}>
          <label htmlFor={c.nome} style={label}>
            {c.rotulo}
          </label>
          <input id={c.nome} className="pf365" name={c.nome} inputMode="decimal" defaultValue={formatarValorCampo(parametros[c.nome])} style={{ ...field, marginBottom: 4 }} required />
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#8792a2" }}>{c.ajuda}</p>
        </div>
      ))}
      <label htmlFor="acrescimoPct" style={label}>
        Acréscimo sobre o total (%)
      </label>
      <input id="acrescimoPct" className="pf365" name="acrescimoPct" inputMode="decimal" defaultValue={formatarPercentual(parametros.acrescimoPct)} style={field} required />
      <label htmlFor="validadeDias" style={label}>
        Validade da proposta (dias)
      </label>
      <input id="validadeDias" className="pf365" name="validadeDias" type="number" min={1} max={60} defaultValue={validadeDias} style={field} required />

      {state.error && <div style={{ margin: "0 0 12px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{state.error}</div>}
      {state.ok && <div style={{ margin: "0 0 12px", fontSize: 13, color: "#1e7b3c", fontWeight: 600 }}>{state.ok}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={pending} style={{ ...botaoPrimario, opacity: pending ? 0.75 : 1 }}>
          {pending ? "Salvando…" : "Salvar padrões"}
        </button>
        <Link href="/parceiro365/admin/propostas" style={botaoSecundario}>
          Voltar
        </Link>
      </div>
    </form>
  )
}
