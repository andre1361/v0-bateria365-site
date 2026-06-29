"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, Users, Gift, Award, MapPin, CalendarDays, BookOpen, Instagram, Copy, ExternalLink, Building2 } from "lucide-react"

type Confirmado = { id: string; nome: string; telefone: string; email: string; empresa: string }
type GrupoEmpresa = { empresa: string; count: number; meta: number }
type Ev = {
  id: string
  titulo: string
  modulo: string
  dataISO: string
  horario: string
  cidade: string
  local: string
  responsavel: string
  instagram: string
  slug: string
}

function fmtDate(iso: string) {
  const p = (iso || "").split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso || ""
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 20 }
const stepNum: React.CSSProperties = {
  width: 30,
  height: 30,
  flex: "none",
  borderRadius: "50%",
  background: "#04377f",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 50,
  padding: "0 22px",
  background: "#04377f",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 800,
  textDecoration: "none",
  cursor: "pointer",
}

export function TrainingHub({
  ev,
  distNome,
  confirmados,
  porEmpresa,
  empresas,
}: {
  ev: Ev
  distNome: string
  confirmados: Confirmado[]
  porEmpresa: GrupoEmpresa[]
  empresas: { id: string; nome: string }[]
}) {
  const [origin, setOrigin] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)
  useEffect(() => setOrigin(window.location.origin), [])

  const total = confirmados.length
  const linkEmpresa = (companyId: string) => `${origin}/parceiro365/convite/${ev.slug}/equipe/${companyId}`
  const linkAberto = `${origin}/parceiro365/convite/${ev.slug}`

  const copiar = (key: string, url: string) => {
    navigator.clipboard?.writeText(url)
    setCopiado(key)
    setTimeout(() => setCopiado((c) => (c === key ? null : c)), 1800)
  }

  const exportarCSV = () => {
    if (!total) return
    const esc = (v: string) => '"' + String(v || "").replace(/"/g, '""') + '"'
    const csv =
      "﻿" +
      [["Nome", "WhatsApp", "E-mail", "Empresa"], ...confirmados.map((c) => [c.nome, c.telefone, c.email, c.empresa])]
        .map((r) => r.map(esc).join(","))
        .join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `presentes-${ev.slug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const detalhe = [
    ev.dataISO ? { icon: CalendarDays, txt: fmtDate(ev.dataISO) + (ev.horario ? ` · ${ev.horario}` : "") } : null,
    ev.cidade || ev.local ? { icon: MapPin, txt: [ev.cidade, ev.local].filter(Boolean).join(" · ") } : null,
    ev.modulo ? { icon: BookOpen, txt: ev.modulo } : null,
    ev.responsavel ? { icon: Users, txt: `Treinamento com ${ev.responsavel}` } : null,
    ev.instagram ? { icon: Instagram, txt: `@${ev.instagram.replace(/^@+/, "")}` } : null,
  ].filter(Boolean) as { icon: typeof MapPin; txt: string }[]

  const steps = [
    { icon: Mail, label: "Convite" },
    { icon: Users, label: `Quem vai (${total})` },
    { icon: Gift, label: "Sorteio" },
    { icon: Award, label: "Certificados" },
  ]

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Dados do treino + trilha de passos */}
      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {detalhe.map((d, i) => {
            const Icon = d.icon
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", background: "#f4f7fb", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#41506a" }}>
                <Icon size={15} color="#04377f" /> {d.txt}
              </span>
            )
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", background: "#04377f", color: "#fff", borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
                <span style={{ opacity: 0.7 }}>{i + 1}</span>
                <Icon size={14} /> {s.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Passo 1 — Convite */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={stepNum}>1</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2733" }}>Mande o convite</div>
            <div style={{ fontSize: 13, color: "#8a94a3" }}>Cada empresa recebe um link e cadastra a própria equipe.</div>
          </div>
        </div>

        {empresas.length === 0 ? (
          <div style={{ background: "#fff7ed", border: "1px solid #fde6c8", borderRadius: 12, padding: 14, fontSize: 13, color: "#92580a" }}>
            Você ainda não tem empresas cadastradas.{" "}
            <Link href="/parceiro365/empresas" style={{ color: "#04377f", fontWeight: 700 }}>
              Cadastrar empresa
            </Link>{" "}
            para gerar o link por empresa.
          </div>
        ) : (
          <div style={{ border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden" }}>
            {empresas.map((c) => {
              const key = "e" + c.id
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: "1px solid #f3f5f9" }}>
                  <Building2 size={15} color="#9298a6" style={{ flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "#1f2733", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                  <button type="button" onClick={() => copiar(key, linkEmpresa(c.id))} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", background: "#04377f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    <Copy size={13} /> {copiado === key ? "Copiado!" : "Copiar link"}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
          <button type="button" onClick={() => copiar("aberto", linkAberto)} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <Copy size={14} /> {copiado === "aberto" ? "Copiado!" : "Copiar link aberto (qualquer pessoa)"}
          </button>
          <Link href="/parceiro365/convites" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
            <ExternalLink size={14} /> Criar imagem do convite
          </Link>
        </div>
      </div>

      {/* Passo 2 — Quem vai */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={stepNum}>2</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2733" }}>Quem vai ({total})</div>
            <div style={{ fontSize: 13, color: "#8a94a3" }}>Lista de presença confirmada pelas empresas.</div>
          </div>
          {total > 0 && (
            <button type="button" onClick={exportarCSV} style={{ height: 32, padding: "0 12px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Baixar lista (CSV)
            </button>
          )}
        </div>

        {total === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#8a94a3" }}>Ninguém confirmou ainda. Mande o convite no passo 1. 🙂</p>
        ) : (
          <>
            {porEmpresa.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {porEmpresa.map((g) => (
                  <span key={g.empresa} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", background: "#eef4fc", color: "#04377f", borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>
                    {g.empresa} <strong>{g.meta > 0 ? `${g.count}/${g.meta}` : g.count}</strong>
                  </span>
                ))}
              </div>
            )}
            <div style={{ border: "1px solid #eef1f5", borderRadius: 12, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
              {confirmados.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 12px", borderBottom: "1px solid #f3f5f9", fontSize: 13 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#1f2733" }}>{c.nome}</div>
                    {c.empresa && <div style={{ fontSize: 12, color: "#8a94a3" }}>{c.empresa}</div>}
                  </div>
                  <div style={{ color: "#6a7585", textAlign: "right", whiteSpace: "nowrap" }}>{c.telefone}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Passo 3 — Sorteio */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={stepNum}>3</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2733" }}>Sorteio</div>
            <div style={{ fontSize: 13, color: "#8a94a3" }}>No dia, sorteie um brinde entre os presentes.</div>
          </div>
        </div>
        {total > 0 ? (
          <Link href={`/parceiro365/sorteios?treino=${ev.id}`} style={{ ...primaryBtn, marginTop: 10 }}>
            <Gift size={18} /> Sortear entre os presentes
          </Link>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, color: "#9aa4b2" }}>Disponível quando houver presença confirmada.</div>
        )}
      </div>

      {/* Passo 4 — Certificados */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={stepNum}>4</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2733" }}>Certificados</div>
            <div style={{ fontSize: 13, color: "#8a94a3" }}>Depois do treino, gere os certificados (data já vem preenchida).</div>
          </div>
        </div>
        {total > 0 ? (
          <Link href={`/parceiro365/certificados?treino=${ev.id}`} style={{ ...primaryBtn, marginTop: 10 }}>
            <Award size={18} /> Emitir certificados dos presentes
          </Link>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, color: "#9aa4b2" }}>Disponível quando houver presença confirmada.</div>
        )}
      </div>
    </div>
  )
}
