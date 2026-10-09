import type { Calculo } from "@/lib/proposta/calculo"
import { formatarBRL, formatarDataComDia } from "@/lib/proposta/formato"
import { ORIGENS } from "@/lib/proposta/origens"
import { card } from "../estilos"

const linha: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f0f2f6" }

export function Resumo({ calculo, datas }: { calculo: Calculo; datas: { idaISO: string; voltaISO: string } | null }) {
  const c = calculo
  return (
    <aside style={{ ...card, position: "sticky", top: 84 }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Resumo (só você vê)</h2>
      {datas && (
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#41506a" }}>
          Ida: <strong>{formatarDataComDia(datas.idaISO)}</strong> · Volta: <strong>{formatarDataComDia(datas.voltaISO)}</strong>
        </p>
      )}
      {ORIGENS.map((o) => (
        <div key={o.id} style={linha}>
          <span>Passagem {o.cidade}</span>
          <span style={{ color: c.passagens[o.id] === null ? "#c0392b" : undefined }}>
            {c.passagens[o.id] === null ? "falta escolher" : formatarBRL(c.passagens[o.id] as number)}
          </span>
        </div>
      ))}
      <div style={linha}>
        <span>Hotel ({c.diarias} diárias × 2)</span>
        <span>{formatarBRL(c.hotel)}</span>
      </div>
      <div style={linha}>
        <span>Alimentação ({c.diasAlimentacao} dias × 2)</span>
        <span>{formatarBRL(c.alimentacao)}</span>
      </div>
      <div style={linha}>
        <span>Uber</span>
        <span>{formatarBRL(c.uber)}</span>
      </div>
      <div style={linha}>
        <span>Honorário</span>
        <span>{formatarBRL(c.honorario)}</span>
      </div>
      {c.acrescimo > 0 && (
        <div style={linha}>
          <span>Acréscimo</span>
          <span>{formatarBRL(c.acrescimo)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Total da proposta</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#04377f" }}>{formatarBRL(c.total)}</span>
      </div>
      {!c.completo && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9a6700" }}>O total ainda não inclui todas as passagens.</p>}
    </aside>
  )
}
