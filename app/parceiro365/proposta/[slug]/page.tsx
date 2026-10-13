import type { Metadata } from "next"
import { cookies } from "next/headers"
import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { dataISONoBrasil, formatarBRL, formatarDataISO, somarDiasISO } from "@/lib/proposta/formato"
import { ENTRADA_PCT, condicoesPagamento } from "@/lib/proposta/pagamento"
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

// Textos fixos da proposta comercial (resumo da proposta enviada a Palmas em 2026).
const MAX_PARTICIPANTES = 150
const ESPECIALISTAS = [
  {
    nome: "Rafael André | Sul Battery",
    texto: "No setor de baterias desde os 12 anos, soma 27 anos de experiência no mercado automotivo. Fundador da Sul Battery (Canoas/RS) e um dos criadores do Bateria 365. Especialista em diagnóstico avançado, gestão e padronização do atendimento técnico.",
  },
  {
    nome: "Davi Barbosa | Barbosa Baterias",
    texto: "No setor desde os 10 anos, com 27 anos de experiência no mercado de baterias. Fundador da Barbosa Baterias e coautor do Bateria 365. Une gestão, marketing e experiência de campo.",
  },
]
const TOPICOS = [
  "Venda e técnicas de venda",
  "Marketing aplicado ao negócio de baterias",
  "Principais conceitos de um negócio de baterias de sucesso",
  "Princípios da troca da bateria de 12 V em carros elétricos e híbridos",
  "Troca segura de bateria: monitoramento de Power, LED e teste de fuga de corrente, diagnóstico prévio e diagnóstico combinado",
]
const RESULTADOS = [
  "Equipe mais segura e preparada para vender, com discurso técnico padronizado",
  "Loja posicionada como referência técnica no novo mercado de baterias",
  "Procedimento de troca seguro e correto, com menos erros e retrabalho",
  "Domínio das particularidades da bateria de 12 V em veículos elétricos e híbridos",
]
const NAO_INCLUSO = [
  ["Local e estrutura", "auditório ou sala com projetor e som"],
  ["Coffee break", "organização e custo"],
  ["Convocação", "mobilizar e garantir a presença do público"],
  ["Cronograma", "definido em conjunto com a equipe Bateria 365"],
  ["Visitas técnicas", "indicar os clientes e combinar os horários com as lojas"],
]

const secao: React.CSSProperties = { background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: "24px 26px", marginTop: 14, breakInside: "avoid" }
const tituloSecao: React.CSSProperties = { margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#04377f" }
const texto: React.CSSProperties = { margin: "0 0 10px", fontSize: 14, lineHeight: 1.55, color: "#2c3646" }
const lista: React.CSSProperties = { margin: "0 0 10px", paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: "#2c3646" }
const linha: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #f0f2f6", fontSize: 14 }

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={linha}>
      <span style={{ color: "#6a7585" }}>{rotulo}</span>
      <strong style={{ textAlign: "right" }}>{valor}</strong>
    </div>
  )
}

function Conteudo({ p, nome, cidade }: { p: typeof proposals.$inferSelect; nome: string; cidade: string }) {
  const status = statusEfetivo(p.status, p.validaAte)
  const n = p.duracaoDias
  const periodo = n === 1 ? formatarDataISO(p.dataInicioISO) : `${formatarDataISO(p.dataInicioISO)} a ${formatarDataISO(somarDiasISO(p.dataInicioISO, n - 1))}`
  const validade = p.validaAte ? formatarDataISO(dataISONoBrasil(p.validaAte)) : ""
  const visitas = p.visitasTecnicas
  const pagamento = condicoesPagamento(p.total)
  const incluso = [
    "Treinamento ministrado pelos instrutores oficiais do Bateria 365",
    "Passagens aéreas, hospedagem, alimentação e transporte da equipe",
    ...(visitas > 0 ? [`${visitas} visita${visitas > 1 ? "s" : ""} técnica${visitas > 1 ? "s" : ""} para clientes selecionados`] : []),
    "Acesso ao Parceiro 365, sistema de gestão do treinamento: convidados, empresas e alunos, sorteios e emissão dos certificados após o treinamento",
    "Material de apoio digital",
    "Certificados digitais para todos os participantes",
    "Assessoria técnica antes e depois do treinamento",
    "Cobertura audiovisual profissional dos melhores momentos",
  ]

  return (
    <div style={{ maxWidth: 720, margin: "4vh auto 40px", padding: "0 16px", opacity: status === "expirada" ? 0.6 : 1 }}>
      <div style={{ ...secao, marginTop: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6a7585" }}>Proposta comercial</div>
        <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 800 }}>Treinamento Bateria 365</h1>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#41506a" }}>
          Programa de capacitação para <strong>{nome}</strong>
          {cidade ? ` · ${cidade}` : ""}
        </p>
        <Linha rotulo="Destinatário" valor={nome} />
        {p.responsavel && <Linha rotulo="Negociação" valor={p.responsavel} />}
        {p.cnpj && <Linha rotulo="CNPJ" valor={p.cnpj} />}
        {p.endereco && <Linha rotulo="Endereço" valor={p.endereco} />}
        <Linha rotulo="Local do treinamento" valor={p.destinoCidade} />
        <Linha rotulo="Data prevista" valor={periodo} />
        <Linha rotulo="Duração" valor={`${n} dia${n > 1 ? "s" : ""}`} />
        {validade && <Linha rotulo="Validade da proposta" valor={validade} />}
        <div style={{ margin: "20px 0 0", padding: "18px 16px", background: "#f2f6fc", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#41506a", fontWeight: 700 }}>Investimento total</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#04377f", marginTop: 4 }}>{formatarBRL(p.total)}</div>
          <div style={{ fontSize: 12.5, color: "#6a7585", marginTop: 4 }}>
            Cerca de {formatarBRL(Math.round(p.total / MAX_PARTICIPANTES))} por participante, com {MAX_PARTICIPANTES} participantes. Todas as despesas da equipe incluídas.
          </div>
        </div>
      </div>

      <section style={secao}>
        <h2 style={tituloSecao}>Apresentação</h2>
        <p style={texto}>
          O Bateria 365 é um programa de especialização que prepara lojas e equipes para o novo mercado de baterias automotivas. Une gestão, diagnóstico e
          vendas para que os profissionais entendam os novos sistemas — como Start-Stop, alternadores pilotados e sensores BMS — e apliquem padrões de
          atendimento e instalação com segurança e credibilidade. Já formou mais de 2.000 lojistas e técnicos em todo o Brasil.
        </p>
        <h3 style={{ margin: "14px 0 8px", fontSize: 14.5, fontWeight: 800 }}>Especialistas responsáveis</h3>
        {ESPECIALISTAS.map((e) => (
          <p key={e.nome} style={texto}>
            <strong>{e.nome}</strong> — {e.texto}
          </p>
        ))}
      </section>

      <section style={secao}>
        <h2 style={tituloSecao}>O treinamento — Módulo 1: Primeiros Passos para a Excelência</h2>
        <p style={texto}>Módulo de entrada do programa e base para os demais (Instalação Perfeita, Diagnóstico Avançado, Start-Stop e BMS, Pós-Venda e Garantia).</p>
        <h3 style={{ margin: "12px 0 6px", fontSize: 14.5, fontWeight: 800 }}>Tópicos</h3>
        <ul style={lista}>
          {TOPICOS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h3 style={{ margin: "12px 0 6px", fontSize: 14.5, fontWeight: 800 }}>Resultados esperados</h3>
        <ul style={lista}>
          {RESULTADOS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p style={{ ...texto, margin: 0 }}>
          <strong>Formato:</strong> teórico e expositivo, com abordagem visual e linguagem técnica acessível. Até {MAX_PARTICIPANTES} participantes, {n} dia
          {n > 1 ? "s" : ""} de conteúdo.
        </p>
      </section>

      {visitas > 0 && (
        <section style={secao}>
          <h2 style={tituloSecao}>
            {visitas} visita{visitas > 1 ? "s" : ""} técnica{visitas > 1 ? "s" : ""} para clientes selecionados
          </h2>
          <p style={{ ...texto, margin: 0 }}>
            Realizadas diretamente nas lojas dos principais clientes indicados pela distribuidora. Cada visita tem 1 hora e é um treinamento básico e
            prático de <strong>troca segura de bateria e utilização de escâner</strong>, conduzido pelos especialistas do Bateria 365.
          </p>
        </section>
      )}

      <section style={secao}>
        <h2 style={tituloSecao}>Está incluso</h2>
        <ul style={{ ...lista, margin: 0 }}>
          {incluso.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h2 style={{ ...tituloSecao, marginTop: 20 }}>Não está incluso — fica com o distribuidor</h2>
        <ul style={{ ...lista, margin: 0 }}>
          {NAO_INCLUSO.filter(([r]) => visitas > 0 || r !== "Visitas técnicas").map(([r, t]) => (
            <li key={r}>
              <strong>{r}:</strong> {t}
            </li>
          ))}
        </ul>
      </section>

      <section style={secao}>
        <h2 style={tituloSecao}>Condições de pagamento</h2>
        <Linha rotulo={`Entrada (${ENTRADA_PCT}%) — no aceite da proposta`} valor={formatarBRL(pagamento.entrada)} />
        {pagamento.parcelas.map((v, i) => (
          <Linha key={i} rotulo={`${i + 1}ª parcela mensal`} valor={formatarBRL(v)} />
        ))}
        <div style={{ ...linha, borderBottom: "none", fontSize: 15 }}>
          <strong>Total</strong>
          <strong style={{ color: "#04377f" }}>{formatarBRL(p.total)}</strong>
        </div>
        {validade && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6a7585" }}>Proposta válida até {validade}.</p>}
      </section>

      {status === "enviada" && <Aceite slug={p.slug as string} visto={p.updatedAt.toISOString()} />}
      {status === "expirada" && (
        <p style={{ marginTop: 16, padding: 14, background: "#fff7ed", border: "1px solid #f4d9ae", borderRadius: 12, color: "#9a6700", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta expirada — fale com a equipe Bateria 365 para renovar.
        </p>
      )}
      {status === "aceita" && (
        <p style={{ marginTop: 16, padding: 14, background: "#e7f6ec", border: "1px solid #bfe3cb", borderRadius: 12, color: "#1e7b3c", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta aceita{p.aceitaEm ? ` em ${formatarDataISO(dataISONoBrasil(p.aceitaEm))}` : ""}.{" "}
          {p.eventId ? "Seu treinamento já está na agenda." : "A equipe Bateria 365 vai confirmar a agenda."}
        </p>
      )}
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <BotaoImprimir />
      </div>
    </div>
  )
}
