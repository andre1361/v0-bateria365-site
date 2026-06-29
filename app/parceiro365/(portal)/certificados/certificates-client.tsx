"use client"

import { useActionState, useEffect, useState } from "react"
import { Certificate, dataExtenso } from "@/app/parceiro365/certificate"
import { PrintStyles } from "@/app/parceiro365/print-styles"
import { logCertificates, saveEmitLink, type LinkState } from "./actions"

type Row = { nome: string; empresa: string; data: string }
type Tab = "ind" | "lote" | "link"

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
const linkInitial: LinkState = {}

function parseLote(text: string, data: string): Row[] {
  const linhas = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (!linhas.length) return []
  const delim =
    (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length ? ";" : linhas[0].includes("\t") ? "\t" : ","
  const hasHeader = /nome|aluno|name/.test(linhas[0].toLowerCase())
  const body = hasHeader ? linhas.slice(1) : linhas
  return body
    .map((l) => {
      const c = l.split(delim).map((x) => x.trim())
      return { nome: c[0] || "", empresa: c[1] || "", data }
    })
    .filter((r) => r.nome)
}

function dedupeByNome(rows: Row[]): Row[] {
  const seen = new Set<string>()
  const out: Row[] = []
  for (const r of rows) {
    const k = r.nome.trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}

type Aluno = { id: string; nome: string; empresa: string; companyId: string | null }
type Empresa = { id: string; nome: string }

export function CertificatesClient({
  distribuidor,
  cidade,
  slug,
  alunos,
  empresas,
}: {
  distribuidor: string
  cidade: string
  slug: string | null
  alunos: Aluno[]
  empresas: Empresa[]
}) {
  const [tab, setTab] = useState<Tab>("ind")
  const [nome, setNome] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [data, setData] = useState("")
  const [loteText, setLoteText] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [busca, setBusca] = useState("")
  const [empresaFiltro, setEmpresaFiltro] = useState("")
  const [printRows, setPrintRows] = useState<Row[]>([])
  const [origin, setOrigin] = useState("")
  const [linkState, linkAction, savingLink] = useActionState(saveEmitLink, linkInitial)

  useEffect(() => {
    const n = new Date()
    setData(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`)
    setOrigin(window.location.origin)
  }, [])

  const currentSlug = linkState.slug || slug
  const emitUrl = currentSlug ? `${origin}/parceiro365/emitir/${currentSlug}` : ""
  const extenso = dataExtenso(data)
  const selecionados = alunos
    .filter((a) => selectedIds.includes(a.id))
    .map((a) => ({ nome: a.nome, empresa: a.empresa, data }))
  const loteRows = dedupeByNome([...selecionados, ...parseLote(loteText, data)])
  const alunosFiltrados = alunos.filter((a) => {
    if (empresaFiltro === "__none__" && a.companyId) return false
    if (empresaFiltro && empresaFiltro !== "__none__" && a.companyId !== empresaFiltro) return false
    if (busca.trim() && !a.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false
    return true
  })

  const imprimir = (rows: Row[]) => {
    if (!rows.length) return
    setPrintRows(rows)
    logCertificates(rows).catch(() => {})
    setTimeout(() => window.print(), 300)
  }

  const tabBtn = (t: Tab, lbl: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      style={{
        height: 36,
        padding: "0 16px",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        background: tab === t ? "#fff" : "transparent",
        color: tab === t ? "#04377f" : "#6a7585",
        boxShadow: tab === t ? "0 1px 3px rgba(16,33,60,0.12)" : "none",
      }}
    >
      {lbl}
    </button>
  )

  return (
    <div style={{ maxWidth: 1180 }}>
      <PrintStyles />

      <div style={{ display: "inline-flex", gap: 4, background: "#e7ecf3", padding: 4, borderRadius: 11, marginBottom: 22 }}>
        {tabBtn("ind", "Um de cada vez")}
        {tabBtn("lote", "Vários de uma vez")}
        {tabBtn("link", "A pessoa baixa sozinha")}
      </div>

      {tab === "ind" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          <section style={{ flex: "1 1 300px", maxWidth: 360, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Dados do certificado</h2>
            {alunos.length > 0 && (
              <>
                <label style={label}>Aluno cadastrado</label>
                <select
                  className="pf365"
                  value=""
                  onChange={(e) => {
                    const a = alunos.find((x) => x.id === e.target.value)
                    if (a) {
                      setNome(a.nome)
                      setEmpresa(a.empresa)
                    }
                  }}
                  style={{ ...field, padding: "0 10px" }}
                >
                  <option value="">— selecionar aluno cadastrado —</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label style={label}>
              Nome do aluno <span style={{ color: "#d6442f" }}>*</span>
            </label>
            <input className="pf365" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Oliveira" style={field} />
            <label style={label}>Empresa (opcional)</label>
            <input className="pf365" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" style={field} />
            <label style={label}>Data do treinamento</label>
            <input className="pf365" type="date" value={data} onChange={(e) => setData(e.target.value)} style={field} />
            <div style={{ fontSize: 12, color: "#8a94a3", marginBottom: 20 }}>
              Distribuidor <strong style={{ color: "#41506a" }}>{distribuidor}</strong>
              {cidade ? ` · ${cidade}` : ""}
            </div>
            <button
              type="button"
              onClick={() => imprimir([{ nome, empresa, data }])}
              disabled={!nome.trim()}
              style={{
                width: "100%",
                height: 46,
                background: "#04377f",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14.5,
                fontWeight: 700,
                cursor: nome.trim() ? "pointer" : "not-allowed",
                opacity: nome.trim() ? 1 : 0.6,
              }}
            >
              ⬇ Baixar PDF
            </button>
          </section>
          <section style={{ flex: "1.7 1 440px", minWidth: 320 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a3", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 2px 10px" }}>
              Pré-visualização
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 8px 30px rgba(16,33,60,0.08)", border: "1px solid #e6eaf1" }}>
              <Certificate nome={nome} empresa={empresa} distribuidor={distribuidor} cidade={cidade} extenso={extenso} />
            </div>
          </section>
        </div>
      )}

      {tab === "lote" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          <section style={{ flex: "1 1 320px", maxWidth: 400, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>Lista de alunos</h2>
            <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#6a7585" }}>
              Um por linha. Opcional: <strong>Nome, Empresa</strong>.
            </p>
            <label style={label}>Data do treinamento</label>
            <input className="pf365" type="date" value={data} onChange={(e) => setData(e.target.value)} style={field} />

            {alunos.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={label}>Alunos cadastrados</label>
                {empresas.length > 0 && (
                  <select
                    className="pf365"
                    value={empresaFiltro}
                    onChange={(e) => setEmpresaFiltro(e.target.value)}
                    style={{ ...field, padding: "0 10px", marginBottom: 8 }}
                  >
                    <option value="">Todas as empresas</option>
                    {empresas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                    <option value="__none__">Sem empresa</option>
                  </select>
                )}
                <input className="pf365" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno…" style={{ ...field, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button type="button" onClick={() => setSelectedIds(alunosFiltrados.map((a) => a.id))} style={{ flex: 1, height: 32, background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Selecionar todos
                  </button>
                  <button type="button" onClick={() => setSelectedIds([])} style={{ flex: "none", height: 32, padding: "0 12px", background: "#fff", color: "#6a7585", border: "1.5px solid #dde3ec", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Limpar
                  </button>
                </div>
                <div style={{ maxHeight: 170, overflow: "auto", border: "1px solid #eef1f5", borderRadius: 10 }}>
                  {alunosFiltrados.length === 0 ? (
                    <div style={{ padding: "16px", fontSize: 12.5, color: "#8a94a3", textAlign: "center" }}>Nenhum aluno encontrado.</div>
                  ) : (
                    alunosFiltrados.map((a) => (
                      <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", fontSize: 13, borderBottom: "1px solid #f3f5f9", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(a.id)}
                          onChange={(e) => setSelectedIds((prev) => (e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)))}
                          style={{ width: 15, height: 15, accentColor: "#04377f", flex: "none" }}
                        />
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.nome}
                          {a.empresa ? ` · ${a.empresa}` : ""}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#8a94a3", marginTop: 6 }}>{selectedIds.length} selecionado(s)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 2px" }}>
                  <div style={{ flex: 1, height: 1, background: "#eef1f5" }} />
                  <span style={{ fontSize: 11, color: "#9aa4b2", fontWeight: 600 }}>OU COLE UMA LISTA</span>
                  <div style={{ flex: 1, height: 1, background: "#eef1f5" }} />
                </div>
              </div>
            )}

            <textarea
              className="pf365"
              value={loteText}
              onChange={(e) => setLoteText(e.target.value)}
              placeholder={"Maria Oliveira, Auto Peças Silva\nJoão Santos"}
              style={{ width: "100%", height: 140, padding: "10px 12px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 10, color: "#1f2733", resize: "vertical", lineHeight: 1.5, background: "#fff" }}
            />
            <button
              type="button"
              onClick={() => imprimir(loteRows)}
              disabled={!loteRows.length}
              style={{
                width: "100%",
                height: 46,
                marginTop: 12,
                background: "#04377f",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loteRows.length ? "pointer" : "not-allowed",
                opacity: loteRows.length ? 1 : 0.6,
              }}
            >
              ⬇ Gerar PDF ({loteRows.length} pág.)
            </button>
          </section>
          <section style={{ flex: "1.4 1 380px", minWidth: 320 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a3", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 2px 10px" }}>
              {loteRows.length} certificado(s)
            </div>
            <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, overflow: "hidden", maxHeight: 360, overflowY: "auto" }}>
              {loteRows.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: "#8a94a3", fontSize: 13 }}>Selecione alunos cadastrados ou cole uma lista ao lado.</div>
              ) : (
                loteRows.map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1.2fr", gap: 8, alignItems: "center", padding: "9px 18px", borderBottom: "1px solid #f3f5f9", fontSize: 12.5 }}>
                    <div style={{ color: "#aab3c0", fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ fontWeight: 700, color: "#1f2733", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</div>
                    <div style={{ color: "#6a7585", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.empresa || "—"}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "link" && (
        <div style={{ maxWidth: 620, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>A pessoa baixa o certificado sozinha</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6a7585" }}>
            Defina uma senha e compartilhe o link. O próprio aluno digita o nome e baixa o certificado.
          </p>

          <form action={linkAction}>
            <label style={label}>Senha de acesso</label>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input className="pf365" name="senha" placeholder="ex.: 365" style={{ ...field, marginBottom: 0 }} required />
              <button
                type="submit"
                disabled={savingLink}
                style={{ height: 44, padding: "0 16px", background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: savingLink ? "wait" : "pointer", whiteSpace: "nowrap" }}
              >
                {savingLink ? "Salvando…" : currentSlug ? "Atualizar" : "Gerar link"}
              </button>
            </div>
            {linkState.error && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {linkState.error}</p>}
            {linkState.ok && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {linkState.ok}</p>}
          </form>

          {emitUrl && (
            <div style={{ marginTop: 20 }}>
              <label style={label}>Link</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  readOnly
                  value={emitUrl}
                  style={{ flex: 1, height: 44, padding: "0 14px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 10, color: "#04377f", background: "#f7f9fc", fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(emitUrl)}
                  style={{ height: 44, padding: "0 16px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Copiar
                </button>
                <a
                  href={emitUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ height: 44, display: "inline-flex", alignItems: "center", padding: "0 16px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                >
                  Abrir
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Área oculta para impressão */}
      <div id="cert-print-area" aria-hidden style={{ position: "absolute", left: "-200vw", top: 0, width: "297mm" }}>
        {printRows.map((r, i) => (
          <div key={i} className="cert-page" style={{ width: "297mm", height: "210mm", overflow: "hidden" }}>
            <Certificate
              nome={r.nome}
              empresa={r.empresa}
              distribuidor={distribuidor}
              cidade={cidade}
              extenso={dataExtenso(r.data)}
              style={{ width: "297mm", height: "210mm" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
