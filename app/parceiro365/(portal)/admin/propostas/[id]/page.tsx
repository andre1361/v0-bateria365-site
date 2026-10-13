import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { UUID_RE } from "@/lib/proposta/entrada"
import { statusEfetivo } from "@/lib/proposta/status"
import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { emailUnidadeMoura, nomeUnidadeMoura, obterConfiguracoes, unidadesMoura } from "../server"
import { EditorClient, type Distribuidor, type PropostaInicial } from "./editor-client"

export default async function EditorPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  // Contas ativas do portal — mais a da própria proposta, mesmo se estiver inativa —
  // e as unidades da Rede Moura que ainda não têm conta (casadas pelo e-mail).
  let daProposta: { distributorId: string | null; mouraId: string | null } | undefined
  if (id !== "nova" && UUID_RE.test(id)) {
    ;[daProposta] = await db.select({ distributorId: proposals.distributorId, mouraId: proposals.mouraId }).from(proposals).where(eq(proposals.id, id))
  }
  const propostaDistId = daProposta?.distributorId
  const contas = await db
    .select({ id: users.id, nome: users.nome, cidade: users.cidade, email: users.email, role: users.role, ativo: users.ativo })
    .from(users)
    .orderBy(asc(users.nome))
  const emailsComConta = new Set(contas.map((u) => u.email.trim().toLowerCase()))
  // Responsável pela negociação: vem da base da Rede Moura, casado pelo e-mail.
  const responsavelPorEmail = new Map(unidadesMoura().map((e) => [emailUnidadeMoura(e), e.responsavel]))
  const distribuidores: Distribuidor[] = [
    ...contas
      .filter((u) => u.role === "distribuidor" && (u.ativo || u.id === propostaDistId))
      .map((u) => ({
        chave: `u:${u.id}`,
        nome: u.nome,
        cidade: u.cidade,
        responsavel: responsavelPorEmail.get(u.email.trim().toLowerCase()) ?? "",
        rotulo: u.cidade ? `${u.nome} — ${u.cidade}` : u.nome,
        grupo: "portal" as const,
      })),
    ...unidadesMoura()
      .filter((e) => !emailsComConta.has(emailUnidadeMoura(e)) || e.id === daProposta?.mouraId)
      .map((e) => ({ chave: `m:${e.id}`, nome: nomeUnidadeMoura(e), cidade: e.cidade, responsavel: e.responsavel, rotulo: `${e.unidade} — ${e.cidade}/${e.uf}`, grupo: "moura" as const }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR")),
  ]

  let inicial: PropostaInicial
  if (id === "nova") {
    const cfg = await obterConfiguracoes()
    inicial = {
      id: null,
      status: "rascunho",
      distribuidor: "",
      destinoIata: "",
      dataInicioISO: "",
      duracaoDias: 1,
      parametros: cfg.parametros,
      validadeDias: cfg.validadeDias,
      voos: {},
      visitasTecnicas: cfg.visitasTecnicas,
      responsavel: "",
      cnpj: "",
      endereco: "",
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
      distribuidor: p.distributorId ? `u:${p.distributorId}` : `m:${p.mouraId}`,
      destinoIata: p.destinoIata,
      dataInicioISO: p.dataInicioISO,
      duracaoDias: p.duracaoDias,
      parametros: p.parametros,
      validadeDias: p.validadeDias,
      voos: p.voos,
      visitasTecnicas: p.visitasTecnicas,
      responsavel: p.responsavel,
      cnpj: p.cnpj,
      endereco: p.endereco,
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
