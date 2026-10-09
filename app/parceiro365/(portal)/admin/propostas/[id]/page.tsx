import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { UUID_RE } from "@/lib/proposta/entrada"
import { statusEfetivo } from "@/lib/proposta/status"
import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { obterConfiguracoes } from "../server"
import { EditorClient, type PropostaInicial } from "./editor-client"

export default async function EditorPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const distribuidores = await db
    .select({ id: users.id, nome: users.nome, cidade: users.cidade })
    .from(users)
    .where(eq(users.role, "distribuidor"))
    .orderBy(asc(users.nome))

  let inicial: PropostaInicial
  if (id === "nova") {
    const cfg = await obterConfiguracoes()
    inicial = {
      id: null,
      status: "rascunho",
      distributorId: "",
      destinoIata: "",
      dataInicioISO: "",
      duracaoDias: 1,
      parametros: cfg.parametros,
      validadeDias: cfg.validadeDias,
      voos: {},
      slug: null,
      chave: null,
      validaAte: null,
      temEvento: false,
    }
  } else {
    if (!UUID_RE.test(id)) notFound()
    const [p] = await db.select().from(proposals).where(eq(proposals.id, id))
    if (!p) notFound()
    inicial = {
      id: p.id,
      status: statusEfetivo(p.status, p.validaAte),
      distributorId: p.distributorId,
      destinoIata: p.destinoIata,
      dataInicioISO: p.dataInicioISO,
      duracaoDias: p.duracaoDias,
      parametros: p.parametros,
      validadeDias: p.validadeDias,
      voos: p.voos,
      slug: p.slug,
      chave: p.chavePlain,
      validaAte: p.validaAte?.toISOString() ?? null,
      temEvento: !!p.eventId,
    }
  }

  return (
    <>
      <PageHeader title={inicial.id ? "Proposta" : "Nova proposta"} subtitle="Treinamento Bateria 365 — 2 instrutores (POA e SJP)" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <EditorClient key={inicial.id ?? "nova"} inicial={inicial} distribuidores={distribuidores} />
      </main>
    </>
  )
}
