"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { saveEventForDistributor, deleteEventForDistributor, type EventAdminState } from "../actions"

type Treino = {
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
  confirmados: number
}
type Form = Omit<Treino, "slug" | "confirmados">

const EMPTY: Form = { id: "", titulo: "", modulo: "", dataISO: "", horario: "", cidade: "", local: "", responsavel: "", instagram: "", template: "square" }
const initial: EventAdminState = {}

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

function fmtDate(iso: string) {
  const p = (iso || "").split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso || ""
}

export function ManageClient({ distribuidor, treinos }: { distribuidor: { id: string; nome: string; cidade: string }; treinos: Treino[] }) {
  const [state, action, saving] = useActionState(saveEventForDistributor, initial)
  const [form, setForm] = useState<Form>(EMPTY)

  useEffect(() => {
    if (state.ok) setForm(EMPTY)
  }, [state])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1180 }}>
      <section style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>{form.id ? "Editar treinamento" : "Novo treinamento"}</h2>
        <form action={action}>
          <input type="hidden" name="distributorId" value={distribuidor.id} />
          <input type="hidden" name="id" value={form.id} />

          <label style={label}>
            Título <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="titulo" value={form.titulo} onChange={set("titulo")} placeholder="Treinamento Bateria 365" style={field} required />

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

          <label style={label}>Quem vai dar o treinamento</label>
          <input className="pf365" name="responsavel" value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do palestrante/instrutor" style={field} />

          <label style={label}>Instagram (para divulgar)</label>
          <input className="pf365" name="instagram" value={form.instagram} onChange={set("instagram")} placeholder="@sualoja" style={field} />

          <label style={label}>Formato da imagem do convite</label>
          <select className="pf365" name="template" value={form.template} onChange={set("template")} style={{ ...field, padding: "0 10px" }}>
            <option value="square">Quadrado (post no feed)</option>
            <option value="vertical">Vertical (story)</option>
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, height: 46, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.75 : 1 }}>
              {saving ? "Salvando…" : form.id ? "Salvar alterações" : "Criar treinamento"}
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

      <section style={{ flex: "1.5 1 460px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
        <Link href="/parceiro365/admin" style={{ fontSize: 12.5, fontWeight: 700, color: "#04377f", textDecoration: "none" }}>
          ← Voltar para distribuidores
        </Link>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6a7585" }}>
          {treinos.length} treinamento(s) deste distribuidor
        </div>

        {treinos.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhum treinamento ainda</div>
            <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "#8a94a3" }}>Crie um treinamento ao lado. Ele aparecerá pronto no portal do distribuidor.</p>
          </div>
        ) : (
          treinos.map((t) => (
            <div key={t.id} style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2733" }}>{t.titulo}</div>
                  <div style={{ fontSize: 12.5, color: "#8a94a3", marginTop: 2 }}>
                    {[t.cidade, fmtDate(t.dataISO), t.horario].filter(Boolean).join(" · ") || "Sem data definida"}
                  </div>
                  <div style={{ fontSize: 12, color: "#04377f", fontWeight: 700, marginTop: 6 }}>{t.confirmados} confirmado(s)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ id: t.id, titulo: t.titulo, modulo: t.modulo, dataISO: t.dataISO, horario: t.horario, cidade: t.cidade, local: t.local, responsavel: t.responsavel, instagram: t.instagram, template: t.template })}
                  style={{ height: 30, padding: "0 12px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Editar
                </button>
                <form action={deleteEventForDistributor}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="distributorId" value={distribuidor.id} />
                  <button
                    type="submit"
                    title="Excluir"
                    onClick={(ev) => {
                      if (!confirm(`Excluir o treinamento "${t.titulo}"? As confirmações também serão removidas.`)) ev.preventDefault()
                    }}
                    style={{ height: 30, width: 30, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
