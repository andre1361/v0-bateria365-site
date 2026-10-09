import type { Metadata } from "next"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { dataISONoBrasil, formatarBRL, formatarDataISO, somarDiasISO } from "@/lib/proposta/formato"
import { statusEfetivo } from "@/lib/proposta/status"
import { Aceite } from "./aceite"
import { PropostaGate } from "./gate"
import { BotaoImprimir } from "./imprimir"

export const metadata: Metadata = {
  title: "Proposta de treinamento — Bateria 365",
  robots: { index: false, follow: false },
}

const caixa: React.CSSProperties = { maxWidth: 420, margin: "8vh auto 0", background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, textAlign: "center" }

export default async function PropostaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [row] = await db
    .select({ p: proposals, nome: users.nome, cidade: users.cidade })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.distributorId))
    .where(eq(proposals.slug, slug))
  const disponivel = !!row && !!row.p.chaveHash && row.p.status !== "rascunho" && row.p.status !== "cancelada"

  let authed = false
  if (disponivel) {
    const c = await cookies()
    authed = c.get(propostaCookieName(slug))?.value === propostaToken(row.p.chaveHash as string, slug)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <style>{"@media print { .nao-imprimir { display: none !important } body { background: #fff } }"}</style>
      <div className="nao-imprimir" style={{ height: 64, background: "#04377f", display: "flex", alignItems: "center", padding: "0 22px", gap: 11, color: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-bateria365-escuro.png" alt="Bateria 365" style={{ height: 32, width: "auto" }} />
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#bcd0ec" }}>Proposta de treinamento</span>
      </div>

      {!disponivel ? (
        <div style={caixa}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Proposta indisponível</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#6a7585" }}>Este link não existe ou a proposta não está mais disponível.</p>
        </div>
      ) : !authed ? (
        <PropostaGate slug={slug} />
      ) : (
        <Conteudo p={row.p} nome={row.nome} cidade={row.cidade} />
      )}
    </div>
  )
}

function Conteudo({ p, nome, cidade }: { p: typeof proposals.$inferSelect; nome: string; cidade: string }) {
  const status = statusEfetivo(p.status, p.validaAte)
  const n = p.duracaoDias
  const periodo = n === 1 ? formatarDataISO(p.dataInicioISO) : `${formatarDataISO(p.dataInicioISO)} a ${formatarDataISO(somarDiasISO(p.dataInicioISO, n - 1))}`
  const validade = p.validaAte ? formatarDataISO(dataISONoBrasil(p.validaAte)) : ""
  const item: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #f0f2f6", fontSize: 14 }

  return (
    <div style={{ maxWidth: 560, margin: "5vh auto 40px", padding: "0 16px" }}>
      <div style={{ background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: "30px 26px", opacity: status === "expirada" ? 0.6 : 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6a7585" }}>Proposta de treinamento</div>
        <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 800 }}>Treinamento Bateria 365</h1>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "#41506a" }}>
          Para <strong>{nome}</strong>
          {cidade ? ` · ${cidade}` : ""}
        </p>
        <div style={item}>
          <span>Data</span>
          <strong>{periodo}</strong>
        </div>
        <div style={item}>
          <span>Duração</span>
          <strong>
            {n} dia{n > 1 ? "s" : ""}
          </strong>
        </div>
        <div style={item}>
          <span>Local</span>
          <strong>{p.destinoCidade}</strong>
        </div>
        <div style={{ margin: "22px 0 8px", padding: "18px 16px", background: "#f2f6fc", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#41506a", fontWeight: 700 }}>Investimento total</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#04377f", marginTop: 4 }}>{formatarBRL(p.total)}</div>
        </div>
        <p style={{ margin: "10px 0 6px", fontSize: 13, color: "#41506a" }}>O valor inclui honorário dos instrutores, passagens aéreas, hospedagem, alimentação e transporte.</p>
        {validade && <p style={{ margin: 0, fontSize: 13, color: "#6a7585" }}>Proposta válida até {validade}.</p>}
      </div>

      {status === "enviada" && <Aceite slug={p.slug as string} />}
      {status === "expirada" && (
        <p style={{ marginTop: 16, padding: 14, background: "#fff7ed", border: "1px solid #f4d9ae", borderRadius: 12, color: "#9a6700", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta expirada — fale com a equipe Bateria 365 para renovar.
        </p>
      )}
      {status === "aceita" && (
        <p style={{ marginTop: 16, padding: 14, background: "#e7f6ec", border: "1px solid #bfe3cb", borderRadius: 12, color: "#1e7b3c", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta aceita{p.aceitaEm ? ` em ${formatarDataISO(dataISONoBrasil(p.aceitaEm))}` : ""}. Seu treinamento já está na agenda.
        </p>
      )}
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <BotaoImprimir />
      </div>
    </div>
  )
}
