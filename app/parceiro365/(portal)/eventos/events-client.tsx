"use client"

import { useActionState, useEffect, useState } from "react"
import { saveEvent, deleteEvent, type EventState } from "./actions"

type Confirmado = { id: string; nome: string; telefone: string }
type Evento = {
  id: string
  titulo: string
  modulo: string
  dataISO: string
  horario: string
  cidade: string
  local: string
  responsavel: string
  instagram: string
  template: string
  slug: string
  confirmados: Confirmado[]
}

type Form = Omit<Evento, "confirmados" | "slug">

const EMPTY: Form = {
  id: "",
  titulo: "",
  modulo: "",
  dataISO: "",
  horario: "",
  cidade: "",
  local: "",
  responsavel: "",
  instagram: "",
  template: "square",
}

const initial: EventState = {}
const field: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  fontSize: 14,
  border: "1.5px solid #dde3ec",
  borderRadius: 10,
  marginBottom: 12,
  color: "#1f2733",
  background: "#fff",
}
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 5 }

export function EventsClient({ eventos }: { eventos: Evento[] }) {
  const [state, action, saving] = useActionState(saveEvent, initial)
  const [form, setForm] = useState<Form>(EMPTY)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)

  useEffect(() => setOrigin(window.location.origin), [])
  useEffect(() => {
    if (state.ok) setForm(EMPTY)
  }, [state])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const linkDe = (slug: string) => `${origin}/parceiro365/convite/${slug}`

  const copiar = (slug: string) => {
    navigator.clipboard?.writeText(linkDe(slug))
    setCopiado(slug)
    setTimeout(() => setCopiado((c) => (c === slug ? null : c)), 1800)
  }

  const exportarCSV = (ev: Evento) => {
    const esc = (v: string) => '"' + String(v || "").replace(/"/g, '""') + '"'
    const csv = "﻿" + [["Nome", "WhatsApp"], ...ev.confirmados.map((c) => [c.nome, c.telefone])].map((r) => r.map(esc).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `confirmados-${ev.slug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1180 }}>
      {/* form */}
      <section style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>{form.id ? "Editar evento" : "Novo evento"}</h2>
        <form action={action}>
          <input type="hidden" name="id" value={form.id} />
          <label style={label}>Título <span style={{ color: "#d6442f" }}>*</span></label>
          <input className="pf365" name="titulo" value={form.titulo} onChange={set("titulo")} placeholder="Treinamento Bateria365" style={field} required />
          <label style={label}>Módulo</label>
          <input className="pf365" name="modulo" value={form.modulo} onChange={set("modulo")} placeholder="Módulo 1 — Fundamentos" style={field} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Data</label>
              <input className="pf365" name="dataISO" type="date" value={form.dataISO} onChange={set("dataISO")} style={field} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Horário</label>
              <input className="pf365" name="horario" value={form.horario} onChange={set("horario")} placeholder="19h" style={field} />
            </div>
          </div>
          <label style={label}>Cidade</label>
          <input className="pf365" name="cidade" value={form.cidade} onChange={set("cidade")} placeholder="Florianópolis" style={field} />
          <label style={label}>Local (endereço)</label>
          <textarea className="pf365" name="local" value={form.local} onChange={set("local")} rows={2} placeholder="Nome do espaço, rua, bairro" style={{ ...field, height: 60, padding: "10px 12px", resize: "vertical" }} />
          <label style={label}>Responsável</label>
          <input className="pf365" name="responsavel" value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do responsável" style={field} />
          <label style={label}>Instagram (para a cobertura)</label>
          <input className="pf365" name="instagram" value={form.instagram} onChange={set("instagram")} placeholder="@sualoja" style={field} />
          <label style={label}>Modelo da arte</label>
          <select className="pf365" name="template" value={form.template} onChange={set("template")} style={{ ...field, padding: "0 10px" }}>
            <option value="square">Seu Convite Chegou (quadrado)</option>
            <option value="vertical">Estamos Chegando (vertical)</option>
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, height: 46, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.75 : 1 }}>
              {saving ? "Salvando…" : form.id ? "Salvar alterações" : "Criar evento"}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(EMPTY)} style={{ height: 46, padding: "0 14px", background: "#fff", color: "#6a7585", border: "1.5px solid #dde3ec", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancelar
              </button>
            )}
          </div>
          {state.error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}
          {state.ok && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {state.ok}</p>}
        </form>
      </section>

      {/* list */}
      <section style={{ flex: "1.5 1 460px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
        {eventos.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhum evento criado</div>
            <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "#8a94a3" }}>Crie um evento para gerar o link de convite com confirmação.</p>
          </div>
        ) : (
          eventos.map((ev) => (
            <div key={ev.id} style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2733" }}>{ev.titulo}</div>
                  <div style={{ fontSize: 12.5, color: "#8a94a3", marginTop: 2 }}>
                    {[ev.cidade, ev.dataISO, ev.horario].filter(Boolean).join(" · ") || "Sem data definida"}
                  </div>
                </div>
                <button type="button" onClick={() => setForm({ id: ev.id, titulo: ev.titulo, modulo: ev.modulo, dataISO: ev.dataISO, horario: ev.horario, cidade: ev.cidade, local: ev.local, responsavel: ev.responsavel, instagram: ev.instagram, template: ev.template })} style={{ height: 30, padding: "0 12px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Editar
                </button>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={ev.id} />
                  <button type="submit" title="Excluir" style={{ height: 30, width: 30, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>×</button>
                </form>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                <input readOnly value={linkDe(ev.slug)} style={{ flex: 1, minWidth: 0, height: 38, padding: "0 12px", fontSize: 12.5, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#04377f", background: "#f7f9fc", fontWeight: 600 }} />
                <button type="button" onClick={() => copiar(ev.slug)} style={{ height: 38, padding: "0 14px", background: "#04377f", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {copiado === ev.slug ? "Copiado!" : "Copiar"}
                </button>
                <a href={linkDe(ev.slug)} target="_blank" rel="noreferrer" style={{ height: 38, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Abrir</a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setExpandido((x) => (x === ev.id ? null : ev.id))} style={{ background: "none", border: "none", color: "#04377f", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  {ev.confirmados.length} confirmado(s) {expandido === ev.id ? "▲" : "▼"}
                </button>
                {ev.confirmados.length > 0 && (
                  <button type="button" onClick={() => exportarCSV(ev)} style={{ marginLeft: "auto", height: 30, padding: "0 12px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Exportar CSV</button>
                )}
              </div>

              {expandido === ev.id && (
                <div style={{ marginTop: 10, borderTop: "1px solid #eef1f5", paddingTop: 10 }}>
                  {ev.confirmados.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12.5, color: "#8a94a3" }}>Ninguém confirmou ainda.</p>
                  ) : (
                    ev.confirmados.map((c) => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", fontSize: 13, borderBottom: "1px solid #f3f5f9" }}>
                        <span style={{ fontWeight: 600, color: "#1f2733" }}>{c.nome}</span>
                        <span style={{ color: "#6a7585" }}>{c.telefone}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
