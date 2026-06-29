"use client"

import { useActionState, useEffect, useState } from "react"
import { saveCompany, deleteCompany, addStudentToCompany, removeStudent, assignSeller, updateSeller, deleteSeller, type CompanyState } from "./actions"
import { maskPhone } from "@/lib/phone"

type Aluno = { id: string; nome: string; email: string; telefone: string }
type Seller = { id: string; nome: string }
type Empresa = {
  id: string
  nome: string
  cidade: string
  responsavel: string
  telefone: string
  email: string
  convidadosPrevistos: number
  observacoes: string
  sellerId: string | null
  sellerNome: string
  cadastrados: number
  confirmados: number
  alunos: Aluno[]
}
type Form = {
  id: string
  nome: string
  cidade: string
  responsavel: string
  telefone: string
  email: string
  convidadosPrevistos: string
  observacoes: string
  sellerId: string
}

const EMPTY: Form = { id: "", nome: "", cidade: "", responsavel: "", telefone: "", email: "", convidadosPrevistos: "", observacoes: "", sellerId: "" }
const initial: CompanyState = {}

const field: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  border: "1.5px solid #dde3ec",
  borderRadius: 10,
  marginBottom: 14,
  color: "#1f2733",
  background: "#fff",
}
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 6 }

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
}

export function CompaniesClient({ empresas, semEmpresa, sellers }: { empresas: Empresa[]; semEmpresa: number; sellers: Seller[] }) {
  const [state, action, saving] = useActionState(saveCompany, initial)
  const [form, setForm] = useState<Form>(EMPTY)
  const [sellerNew, setSellerNew] = useState("")
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    if (state.ok) {
      setForm(EMPTY)
      setSellerNew("")
    }
  }, [state])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const editar = (c: Empresa) => {
    setForm({
      id: c.id,
      nome: c.nome,
      cidade: c.cidade,
      responsavel: c.responsavel,
      telefone: c.telefone,
      email: c.email,
      convidadosPrevistos: c.convidadosPrevistos ? String(c.convidadosPrevistos) : "",
      observacoes: c.observacoes,
      sellerId: c.sellerId || "",
    })
    setSellerNew("")
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const totalPrevistos = empresas.reduce((s, e) => s + e.convidadosPrevistos, 0)
  const totalCadastrados = empresas.reduce((s, e) => s + e.cadastrados, 0)

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1180 }}>
      {/* Formulário criar/editar */}
      <section style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>{form.id ? "Editar empresa" : "Nova empresa"}</h2>
        <form action={action}>
          <input type="hidden" name="id" value={form.id} />
          <label style={label}>
            Nome da empresa <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="nome" value={form.nome} onChange={set("nome")} placeholder="Bateria Sul" style={field} required />

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1.4 }}>
              <label style={label}>Cidade</label>
              <input className="pf365" name="cidade" value={form.cidade} onChange={set("cidade")} placeholder="Florianópolis" style={field} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Convidados</label>
              <input
                className="pf365"
                name="convidadosPrevistos"
                type="number"
                min={0}
                value={form.convidadosPrevistos}
                onChange={set("convidadosPrevistos")}
                placeholder="4"
                style={field}
              />
            </div>
          </div>

          <label style={label}>Responsável (contato)</label>
          <input className="pf365" name="responsavel" value={form.responsavel} onChange={set("responsavel")} placeholder="Nome do contato" style={field} />

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Telefone</label>
              <input
                className="pf365"
                name="telefone"
                inputMode="numeric"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: maskPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                style={field}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>E-mail</label>
              <input className="pf365" name="email" type="email" value={form.email} onChange={set("email")} placeholder="contato@empresa.com" style={field} />
            </div>
          </div>

          <label style={label}>Observações</label>
          <textarea
            className="pf365"
            name="observacoes"
            value={form.observacoes}
            onChange={set("observacoes")}
            rows={2}
            placeholder="Ex.: alinhado pelo gerente; trazer crachás…"
            style={{ ...field, height: 60, padding: "10px 12px", resize: "vertical" }}
          />

          <label style={label}>Vendedor (da distribuidora)</label>
          <select className="pf365" value={form.sellerId} onChange={(e) => setForm((f) => ({ ...f, sellerId: e.target.value }))} style={{ ...field, padding: "0 10px" }}>
            <option value="">— Sem vendedor —</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
            <option value="__new__">— Adicionar novo vendedor —</option>
          </select>
          {form.sellerId === "__new__" && (
            <input className="pf365" value={sellerNew} onChange={(e) => setSellerNew(e.target.value)} placeholder="Nome do vendedor" style={field} />
          )}
          <input type="hidden" name="sellerId" value={form.sellerId === "__new__" || form.sellerId === "" ? "" : form.sellerId} />
          <input type="hidden" name="sellerNew" value={form.sellerId === "__new__" ? sellerNew : ""} />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, height: 46, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.75 : 1 }}
            >
              {saving ? "Salvando…" : form.id ? "Salvar alterações" : "Cadastrar empresa"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(EMPTY)}
                style={{ height: 46, padding: "0 14px", background: "#fff", color: "#6a7585", border: "1.5px solid #dde3ec", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Cancelar
              </button>
            )}
          </div>
          {state.error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}
          {state.ok && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {state.ok}</p>}
        </form>

        {sellers.length > 0 && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed #e2e4ea" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 800, color: "#41506a" }}>Vendedores cadastrados</h3>
            <div style={{ border: "1px solid #eef1f5", borderRadius: 10, overflow: "hidden" }}>
              {sellers.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 8px", borderBottom: "1px solid #f3f5f9" }}>
                  <form action={updateSeller} style={{ display: "flex", flex: 1, minWidth: 0, gap: 6 }}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      name="nome"
                      defaultValue={s.nome}
                      className="pf365"
                      style={{ flex: 1, minWidth: 0, height: 32, padding: "0 8px", fontSize: 12.5, border: "1.5px solid #dde3ec", borderRadius: 7, background: "#fff", color: "#1f2733" }}
                    />
                    <button type="submit" title="Salvar nome" style={{ height: 32, padding: "0 10px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Salvar
                    </button>
                  </form>
                  <form action={deleteSeller}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      title="Excluir vendedor"
                      onClick={(ev) => {
                        if (!confirm(`Excluir o vendedor "${s.nome}"? As empresas atendidas por ele ficarão sem vendedor.`)) ev.preventDefault()
                      }}
                      style={{ height: 32, width: 32, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 7, fontSize: 13, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <p style={{ margin: "8px 2px 0", fontSize: 11.5, color: "#9aa4b2" }}>Edite o nome e clique em Salvar, ou remova com ×.</p>
          </div>
        )}
      </section>

      {/* Lista de empresas */}
      <section style={{ flex: "1.5 1 460px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
        {empresas.length > 0 && (
          <div style={{ display: "flex", gap: 18, padding: "2px 4px", fontSize: 12.5, color: "#6a7585", fontWeight: 600 }}>
            <span>{empresas.length} empresa(s)</span>
            <span>·</span>
            <span>{totalCadastrados} aluno(s) vinculado(s){totalPrevistos > 0 ? ` de ${totalPrevistos} previsto(s)` : ""}</span>
            {semEmpresa > 0 && <span style={{ marginLeft: "auto", color: "#9aa4b2" }}>{semEmpresa} aluno(s) sem empresa</span>}
          </div>
        )}

        {empresas.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhuma empresa cadastrada</div>
            <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "#8a94a3" }}>Cadastre as empresas que vão participar do treinamento e os convidados de cada uma.</p>
          </div>
        ) : (
          empresas.map((e) => {
            const meta = e.convidadosPrevistos
            const pct = meta > 0 ? Math.min(100, Math.round((e.cadastrados / meta) * 100)) : 0
            const atingiu = meta > 0 && e.cadastrados >= meta
            const contato = [e.responsavel, e.telefone, e.email].filter(Boolean).join(" · ")
            return (
              <div key={e.id} style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2733" }}>
                      {e.nome}
                      {e.cidade ? <span style={{ fontSize: 12.5, fontWeight: 600, color: "#8a94a3" }}> · {e.cidade}</span> : null}
                    </div>
                    {contato && <div style={{ fontSize: 12.5, color: "#8a94a3", marginTop: 2 }}>{contato}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => editar(e)}
                    style={{ height: 30, padding: "0 12px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Editar
                  </button>
                  <form action={deleteCompany}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      title="Excluir"
                      onClick={(ev) => {
                        if (!confirm(`Excluir "${e.nome}"? Os alunos vinculados serão desvinculados (não excluídos).`)) ev.preventDefault()
                      }}
                      style={{ height: 30, width: 30, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </form>
                </div>

                {/* Vendedor responsável (reatribuição rápida) */}
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#9298a6", fontWeight: 700 }}>Vendedor</span>
                  <form action={assignSeller} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input type="hidden" name="companyId" value={e.id} />
                    <select
                      key={e.sellerId || "none"}
                      name="sellerId"
                      defaultValue={e.sellerId || ""}
                      onChange={(ev) => ev.currentTarget.form?.requestSubmit()}
                      style={{ height: 30, padding: "0 8px", fontSize: 12.5, border: "1.5px solid #dde3ec", borderRadius: 8, color: "#1f2733", background: "#fff", fontWeight: 600, maxWidth: 220 }}
                    >
                      <option value="">Sem vendedor</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </form>
                </div>

                {/* Progresso de convidados */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#41506a" }}>
                      {meta > 0 ? `${e.cadastrados} / ${meta} convidados` : `${e.cadastrados} aluno(s)`}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: atingiu ? "#0f7a43" : meta > 0 ? "#b8791b" : "#9aa4b2" }}>
                      {meta > 0 ? (atingiu ? "✓ meta atingida" : `faltam ${meta - e.cadastrados}`) : "sem meta definida"}
                    </span>
                  </div>
                  {meta > 0 && (
                    <div style={{ height: 8, background: "#eef1f5", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: atingiu ? "#1f9d57" : "#04377f", borderRadius: 99, transition: "width .3s" }} />
                    </div>
                  )}
                </div>

                {e.confirmados > 0 && (
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#eafaf0", color: "#0f7a43", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    ✔ {e.confirmados} confirmado(s) em eventos
                  </div>
                )}

                {/* Alunos da empresa */}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setExpandido((x) => (x === e.id ? null : e.id))}
                    style={{ background: "none", border: "none", color: "#04377f", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}
                  >
                    {expandido === e.id ? "Ocultar" : "Ver / adicionar"} alunos {expandido === e.id ? "▲" : "▼"}
                  </button>
                </div>

                {expandido === e.id && (
                  <div style={{ marginTop: 10, borderTop: "1px solid #eef1f5", paddingTop: 10 }}>
                    {e.alunos.length === 0 ? (
                      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#8a94a3" }}>Nenhum aluno vinculado ainda.</p>
                    ) : (
                      <div style={{ marginBottom: 10 }}>
                        {e.alunos.map((a) => (
                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f5f9" }}>
                            <div style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "#eef4fc", color: "#04377f", fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {iniciais(a.nome)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2733", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</div>
                              {(a.telefone || a.email) && (
                                <div style={{ fontSize: 11.5, color: "#8a94a3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {[a.telefone, a.email].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                            <form action={removeStudent}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" title="Remover aluno" style={{ height: 28, width: 28, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 7, fontSize: 13, cursor: "pointer" }}>
                                ×
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar aluno a esta empresa */}
                    <form action={addStudentToCompany} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 10, padding: 10 }}>
                      <input type="hidden" name="companyId" value={e.id} />
                      <input
                        className="pf365"
                        name="nome"
                        required
                        placeholder="Nome do aluno *"
                        style={{ flex: "1 1 160px", minWidth: 0, height: 38, padding: "0 12px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 9, background: "#fff", color: "#1f2733" }}
                      />
                      <input
                        className="pf365"
                        name="telefone"
                        inputMode="numeric"
                        onInput={(ev) => {
                          ev.currentTarget.value = maskPhone(ev.currentTarget.value)
                        }}
                        placeholder="(00) 00000-0000"
                        style={{ flex: "1 1 130px", minWidth: 0, height: 38, padding: "0 12px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 9, background: "#fff", color: "#1f2733" }}
                      />
                      <button type="submit" style={{ flex: "none", height: 38, padding: "0 16px", background: "#04377f", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Adicionar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
