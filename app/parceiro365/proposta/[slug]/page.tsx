import type { Metadata } from "next"
import { cookies } from "next/headers"
import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { Conteudo } from "./conteudo"
import { PropostaGate } from "./gate"

export const metadata: Metadata = {
  title: "Proposta de treinamento — Bateria 365",
  robots: { index: false, follow: false },
}

const caixa: React.CSSProperties = { maxWidth: 420, margin: "8vh auto 0", background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, textAlign: "center" }

export default async function PropostaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [row] = await db
    // Sem conta ainda (unidade da Rede Moura): usa os dados copiados na proposta.
    .select({
      p: proposals,
      nome: sql<string>`coalesce(${users.nome}, ${proposals.distribuidorNome})`,
      cidade: sql<string>`coalesce(${users.cidade}, ${proposals.distribuidorCidade})`,
    })
    .from(proposals)
    .leftJoin(users, eq(users.id, proposals.distributorId))
    .where(eq(proposals.slug, slug))
  const disponivel = !!row && !!row.p.chaveHash && row.p.status !== "rascunho" && row.p.status !== "cancelada"

  let authed = false
  if (disponivel) {
    const c = await cookies()
    authed = c.get(propostaCookieName(slug))?.value === propostaToken(row.p.chaveHash as string, slug)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <style>{"@media print { .nao-imprimir { display: none !important } body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact } }"}</style>
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
