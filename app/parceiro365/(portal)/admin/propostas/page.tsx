import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { dataISONoBrasil, formatarBRL, formatarDataISO } from "@/lib/proposta/formato"
import { ROTULO_STATUS, statusEfetivo } from "@/lib/proposta/status"
import { PageHeader } from "../../../page-header"
import { requireAdmin } from "../../../guard"
import { botaoPrimario, botaoSecundario, card } from "./estilos"

const th: React.CSSProperties = { textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#6a7585", textTransform: "uppercase", letterSpacing: "0.04em", padding: "10px 12px", borderBottom: "1px solid #e6eaf1" }
const td: React.CSSProperties = { padding: "12px", fontSize: 13.5, borderBottom: "1px solid #f0f2f6", verticalAlign: "middle" }

export default async function PropostasPage() {
  await requireAdmin()
  const rows = await db
    .select({
      id: proposals.id,
      status: proposals.status,
      validaAte: proposals.validaAte,
      total: proposals.total,
      destinoCidade: proposals.destinoCidade,
      destinoIata: proposals.destinoIata,
      dataInicioISO: proposals.dataInicioISO,
      duracaoDias: proposals.duracaoDias,
      eventId: proposals.eventId,
      distribuidor: users.nome,
    })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.distributorId))
    .orderBy(desc(proposals.updatedAt))

  return (
    <>
      <PageHeader title="Propostas" subtitle="Propostas de treinamento para distribuidores" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <Link href="/parceiro365/admin/propostas/nova" style={botaoPrimario}>
            + Nova proposta
          </Link>
          <Link href="/parceiro365/admin/propostas/configuracoes" style={botaoSecundario}>
            Configurações
          </Link>
        </div>

        {rows.length === 0 ? (
          <div style={{ ...card, maxWidth: 1080, color: "#6a7585", fontSize: 14 }}>Nenhuma proposta ainda. Crie a primeira em “Nova proposta”.</div>
        ) : (
          <div style={{ ...card, padding: 0, maxWidth: 1080, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Distribuidor</th>
                  <th style={th}>Destino</th>
                  <th style={th}>Treinamento</th>
                  <th style={{ ...th, textAlign: "right" }}>Total</th>
                  <th style={th}>Status</th>
                  <th style={th}>Validade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ef = statusEfetivo(r.status, r.validaAte)
                  const rot = ROTULO_STATUS[ef]
                  return (
                    <tr key={r.id}>
                      <td style={td}>
                        <Link href={`/parceiro365/admin/propostas/${r.id}`} style={{ color: "#04377f", fontWeight: 700, textDecoration: "none" }}>
                          {r.distribuidor}
                        </Link>
                      </td>
                      <td style={td}>{r.destinoIata ? `${r.destinoCidade} (${r.destinoIata})` : "—"}</td>
                      <td style={td}>
                        {r.dataInicioISO ? `${formatarDataISO(r.dataInicioISO)} · ${r.duracaoDias} dia${r.duracaoDias > 1 ? "s" : ""}` : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{formatarBRL(r.total)}</td>
                      <td style={td}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: rot.cor, background: rot.fundo }}>
                          {rot.texto}
                          {ef === "aceita" && r.eventId ? " · evento criado" : ""}
                        </span>
                      </td>
                      <td style={td}>{r.validaAte ? formatarDataISO(dataISONoBrasil(r.validaAte)) : "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
