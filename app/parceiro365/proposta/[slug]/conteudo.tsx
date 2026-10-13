import type { proposals } from "@/db/schema"
import { CalendarDays, Check, CheckCircle2, CircleMinus, Clock, MapPin, Users } from "lucide-react"
import { dataISONoBrasil, formatarBRL, formatarDataISO, somarDiasISO } from "@/lib/proposta/formato"
import { ENTRADA_PCT, condicoesPagamento } from "@/lib/proposta/pagamento"
import { statusEfetivo } from "@/lib/proposta/status"
import { Aceite } from "./aceite"
import { BotaoImprimir } from "./imprimir"

// Textos fixos da proposta comercial (resumo da proposta enviada a Palmas em 2026).
const MAX_PARTICIPANTES = 150
const ESPECIALISTAS = [
  {
    nome: "Rafael André",
    empresa: "Sul Battery",
    texto: "No setor de baterias desde os 12 anos, soma 27 anos de experiência no mercado automotivo. Fundador da Sul Battery (Canoas/RS) e um dos criadores do Bateria 365. Especialista em diagnóstico avançado, gestão e padronização do atendimento técnico.",
  },
  {
    nome: "Davi Barbosa",
    empresa: "Barbosa Baterias",
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

const AZUL = "#04377f"
const AMARELO = "#ffc700"
const secao: React.CSSProperties = { background: "#fff", border: "1px solid #e3e7ee", borderRadius: 20, padding: "26px 26px", marginTop: 16, breakInside: "avoid" }
const texto: React.CSSProperties = { margin: "0 0 10px", fontSize: 14.5, lineHeight: 1.6, color: "#2c3646" }
const subtitulo: React.CSSProperties = { margin: "18px 0 10px", fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6a7585" }
const grade = (min: number): React.CSSProperties => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 12 })

function TituloSecao({ numero, children }: { numero: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span style={{ flex: "0 0 32px", height: 32, borderRadius: 10, background: AZUL, color: AMARELO, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
        {String(numero).padStart(2, "0")}
      </span>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: AZUL, lineHeight: 1.25 }}>{children}</h2>
    </div>
  )
}

function Item({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, lineHeight: 1.5, color: "#2c3646", marginBottom: 9 }}>
      <span style={{ flex: "0 0 18px", marginTop: 2 }}>{icone}</span>
      <span>{children}</span>
    </li>
  )
}

function Dado({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: "12px 14px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#bcd0ec" }}>
        {icone}
        {rotulo}
      </div>
      <div style={{ marginTop: 4, fontSize: 15.5, fontWeight: 800, color: "#fff" }}>{valor}</div>
    </div>
  )
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid #eef1f6", fontSize: 14.5 }}>
      <span style={{ color: destaque ? "#1f2733" : "#6a7585", fontWeight: destaque ? 700 : 400 }}>{rotulo}</span>
      {/* Valores em reais não quebram; textos (nome, endereço) quebram no celular. */}
      <strong style={{ textAlign: "right", whiteSpace: valor.startsWith("R$") ? "nowrap" : "normal", overflowWrap: "anywhere" }}>{valor}</strong>
    </div>
  )
}

const iconeOk = <CheckCircle2 size={18} color="#1e7b3c" aria-hidden />
const iconeFora = <CircleMinus size={18} color="#b45309" aria-hidden />
const iconeTopico = <Check size={18} color={AZUL} aria-hidden />

export function Conteudo({ p, nome, cidade }: { p: typeof proposals.$inferSelect; nome: string; cidade: string }) {
  const status = statusEfetivo(p.status, p.validaAte)
  const n = p.duracaoDias
  const dias = `${n} dia${n > 1 ? "s" : ""}`
  const periodo = n === 1 ? formatarDataISO(p.dataInicioISO) : `${formatarDataISO(p.dataInicioISO)} a ${formatarDataISO(somarDiasISO(p.dataInicioISO, n - 1))}`
  const validade = p.validaAte ? formatarDataISO(dataISONoBrasil(p.validaAte)) : ""
  const visitas = p.visitasTecnicas
  const rotuloVisitas = `${visitas} visita${visitas > 1 ? "s" : ""} técnica${visitas > 1 ? "s" : ""}`
  const pagamento = condicoesPagamento(p.total)
  const porParticipante = Math.round(p.total / MAX_PARTICIPANTES)
  const incluso = [
    "Treinamento ministrado pelos instrutores oficiais do Bateria 365",
    "Passagens aéreas, hospedagem, alimentação e transporte da equipe",
    ...(visitas > 0 ? [`${rotuloVisitas} para clientes selecionados`] : []),
    "Acesso ao Parceiro 365, sistema de gestão do treinamento: convidados, empresas e alunos, sorteios e emissão dos certificados após o treinamento",
    "Material de apoio digital",
    "Certificados digitais para todos os participantes",
    "Assessoria técnica antes e depois do treinamento",
    "Cobertura audiovisual profissional dos melhores momentos",
  ]
  let numero = 0

  return (
    <div style={{ maxWidth: 760, margin: "4vh auto 48px", padding: "0 16px" }}>
      <div style={{ opacity: status === "expirada" ? 0.6 : 1 }}>
        <header style={{ background: `linear-gradient(135deg, ${AZUL} 0%, #0b56b3 100%)`, borderRadius: 24, padding: "30px 28px", color: "#fff", breakInside: "avoid" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: AMARELO }}>Proposta comercial</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>Treinamento Bateria 365</h1>
          <p style={{ margin: "0 0 22px", fontSize: 15.5, color: "#dbe6f7" }}>
            Programa de capacitação para <strong style={{ color: "#fff" }}>{nome}</strong>
            {cidade ? ` · ${cidade}` : ""}
          </p>
          <div style={grade(130)}>
            <Dado icone={<MapPin size={14} aria-hidden />} rotulo="Local" valor={p.destinoCidade} />
            <Dado icone={<CalendarDays size={14} aria-hidden />} rotulo="Data prevista" valor={periodo} />
            <Dado icone={<Clock size={14} aria-hidden />} rotulo="Duração" valor={dias} />
            <Dado icone={<Users size={14} aria-hidden />} rotulo="Participantes" valor={`Até ${MAX_PARTICIPANTES}`} />
          </div>
        </header>

        {(p.responsavel || p.cnpj || p.endereco) && (
          <section style={{ ...secao, padding: "18px 26px" }}>
            <Linha rotulo="Destinatário" valor={nome} />
            {p.responsavel && <Linha rotulo="Negociação" valor={p.responsavel} />}
            {p.cnpj && <Linha rotulo="CNPJ" valor={p.cnpj} />}
            {p.endereco && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0 0", fontSize: 14.5 }}>
                <span style={{ color: "#6a7585" }}>Endereço</span>
                <strong style={{ textAlign: "right" }}>{p.endereco}</strong>
              </div>
            )}
          </section>
        )}

        <section style={secao}>
          <TituloSecao numero={++numero}>Apresentação</TituloSecao>
          <p style={texto}>
            O Bateria 365 é um programa de especialização que prepara lojas e equipes para o novo mercado de baterias automotivas. Une gestão, diagnóstico e
            vendas para que os profissionais entendam os novos sistemas — como Start-Stop, alternadores pilotados e sensores BMS — e apliquem padrões de
            atendimento e instalação com segurança e credibilidade.
          </p>
          <p style={{ ...texto, fontWeight: 700, color: AZUL }}>Mais de 2.000 lojistas e técnicos já formados em todo o Brasil.</p>
          <div style={subtitulo}>Especialistas responsáveis</div>
          <div style={grade(260)}>
            {ESPECIALISTAS.map((e) => (
              <div key={e.nome} style={{ border: "1px solid #e3e7ee", borderRadius: 16, padding: 16, background: "#f8fafd" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ flex: "0 0 40px", height: 40, borderRadius: "50%", background: AZUL, color: AMARELO, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {e.nome
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{e.nome}</div>
                    <div style={{ fontSize: 12.5, color: "#6a7585" }}>{e.empresa}</div>
                  </div>
                </div>
                <p style={{ ...texto, margin: 0, fontSize: 13.5 }}>{e.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={secao}>
          <TituloSecao numero={++numero}>O treinamento — Módulo 1: Primeiros Passos para a Excelência</TituloSecao>
          <p style={texto}>Módulo de entrada do programa e base para os demais (Instalação Perfeita, Diagnóstico Avançado, Start-Stop e BMS, Pós-Venda e Garantia).</p>
          <div style={subtitulo}>Tópicos</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {TOPICOS.map((t) => (
              <Item key={t} icone={iconeTopico}>
                {t}
              </Item>
            ))}
          </ul>
          <div style={subtitulo}>Resultados esperados</div>
          <div style={grade(220)}>
            {RESULTADOS.map((t) => (
              <div key={t} style={{ borderLeft: `4px solid ${AMARELO}`, background: "#f8fafd", borderRadius: 10, padding: "12px 14px", fontSize: 14, lineHeight: 1.5, color: "#2c3646" }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {["Teórico e expositivo", "Abordagem visual", `Até ${MAX_PARTICIPANTES} participantes`, dias].map((c) => (
              <span key={c} style={{ padding: "6px 12px", borderRadius: 999, background: "#eaf1fb", color: AZUL, fontSize: 13, fontWeight: 700 }}>
                {c}
              </span>
            ))}
          </div>
        </section>

        {visitas > 0 && (
          <section style={{ ...secao, background: "#f2f7ff", borderColor: "#c9d9f2" }}>
            <TituloSecao numero={++numero}>Visitas técnicas para clientes selecionados</TituloSecao>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto", textAlign: "center", background: AZUL, color: "#fff", borderRadius: 16, padding: "14px 20px" }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: AMARELO, lineHeight: 1 }}>{visitas}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>visita{visitas > 1 ? "s" : ""} · 1h cada</div>
              </div>
              <p style={{ ...texto, margin: 0, flex: "1 1 280px" }}>
                Realizadas diretamente nas lojas dos principais clientes indicados pela distribuidora. Cada visita é um treinamento básico e prático de{" "}
                <strong>troca segura de bateria e utilização de escâner</strong>, conduzido pelos especialistas do Bateria 365.
              </p>
            </div>
          </section>
        )}

        <section style={secao}>
          <TituloSecao numero={++numero}>O que está e o que não está incluso</TituloSecao>
          <div style={grade(280)}>
            <div style={{ border: "1px solid #bfe3cb", background: "#f3fbf6", borderRadius: 16, padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#1e7b3c", marginBottom: 12 }}>Está incluso</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {incluso.map((t) => (
                  <Item key={t} icone={iconeOk}>
                    {t}
                  </Item>
                ))}
              </ul>
            </div>
            <div style={{ border: "1px solid #f4d9ae", background: "#fffaf2", borderRadius: 16, padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#b45309", marginBottom: 12 }}>Fica com o distribuidor</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {NAO_INCLUSO.filter(([r]) => visitas > 0 || r !== "Visitas técnicas").map(([r, t]) => (
                  <Item key={r} icone={iconeFora}>
                    <strong>{r}:</strong> {t}
                  </Item>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section style={{ ...secao, padding: 0, overflow: "hidden", borderColor: "#c9d6ea" }}>
          <div style={{ background: `linear-gradient(135deg, ${AZUL} 0%, #0b56b3 100%)`, color: "#fff", padding: "26px 26px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ flex: "0 0 32px", height: 32, borderRadius: 10, background: AMARELO, color: AZUL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
                {String(++numero).padStart(2, "0")}
              </span>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Investimento</h2>
            </div>
            <div style={grade(220)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#bcd0ec", textTransform: "uppercase", letterSpacing: "0.05em" }}>Investimento total</div>
                <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>{formatarBRL(p.total)}</div>
                <div style={{ fontSize: 13, color: "#dbe6f7", marginTop: 6 }}>Todas as despesas da equipe incluídas.</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", border: `2px solid ${AMARELO}`, borderRadius: 16, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: AMARELO, textTransform: "uppercase", letterSpacing: "0.05em" }}>Por participante</div>
                <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginTop: 6, color: AMARELO }}>{formatarBRL(porParticipante)}</div>
                <div style={{ fontSize: 13, color: "#dbe6f7", marginTop: 6 }}>Considerando {MAX_PARTICIPANTES} participantes.</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 26px 22px" }}>
            <div style={{ ...subtitulo, marginTop: 0 }}>Condições de pagamento</div>
            <Linha rotulo={`Entrada (${ENTRADA_PCT}%) — no aceite da proposta`} valor={formatarBRL(pagamento.entrada)} destaque />
            {pagamento.parcelas.map((v, i) => (
              <Linha key={i} rotulo={`${i + 1}ª parcela mensal`} valor={formatarBRL(v)} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0 0", fontSize: 16 }}>
              <strong>Total</strong>
              <strong style={{ color: AZUL }}>{formatarBRL(p.total)}</strong>
            </div>
            {validade && (
              <p style={{ margin: "14px 0 0", padding: "10px 12px", background: "#f2f6fc", borderRadius: 10, fontSize: 13.5, color: "#41506a" }}>
                Proposta válida até <strong>{validade}</strong>.
              </p>
            )}
          </div>
        </section>
      </div>

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
