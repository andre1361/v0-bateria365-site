"use client"

import { useActionState, useState } from "react"
import { createStudent, importStudents, deleteStudent, type StudentState } from "./actions"

type Aluno = { id: string; nome: string; email: string; telefone: string; empresa: string }

const initial: StudentState = {}

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

export function StudentsClient({ alunos }: { alunos: Aluno[] }) {
  const [createState, createAction, creating] = useActionState(createStudent, initial)
  const [importState, importAction, importing] = useActionState(importStudents, initial)
  const [lista, setLista] = useState("")

  const exportarCSV = () => {
    if (!alunos.length) return
    const esc = (v: string) => '"' + String(v || "").replace(/"/g, '""') + '"'
    const head = ["Nome", "Email", "Telefone", "Empresa"]
    const body = alunos.map((a) => [a.nome, a.email, a.telefone, a.empresa])
    const csv = "﻿" + [head, ...body].map((r) => r.map(esc).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "alunos-parceiro365.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setLista(String(r.result || ""))
    r.readAsText(f, "utf-8")
    e.target.value = ""
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1080 }}>
      <section
        style={{ flex: "1 1 320px", maxWidth: 380, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Novo aluno</h2>
        <form action={createAction}>
          <label style={label}>
            Nome completo <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="nome" placeholder="Maria Oliveira" style={field} required />
          <label style={label}>E-mail</label>
          <input className="pf365" name="email" type="email" placeholder="maria@empresa.com" style={field} />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Telefone</label>
              <input className="pf365" name="telefone" placeholder="(00) 00000-0000" style={field} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Empresa</label>
              <input className="pf365" name="empresa" placeholder="Empresa" style={field} />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{
              width: "100%",
              height: 46,
              background: "#04377f",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.75 : 1,
            }}
          >
            {creating ? "Cadastrando…" : "Cadastrar aluno"}
          </button>
          {createState?.error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {createState.error}</p>}
          {createState?.ok && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {createState.ok}</p>}
        </form>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed #e2e4ea" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 800, color: "#41506a" }}>Importar lista (CSV)</h3>
          <form action={importAction}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 60,
                border: "1.8px dashed #c3cedd",
                borderRadius: 12,
                cursor: "pointer",
                background: "#fafbfd",
                fontSize: 13,
                fontWeight: 700,
                color: "#41506a",
                marginBottom: 10,
              }}
            >
              📄 Selecionar arquivo CSV
              <input type="file" accept=".csv,.txt,.tsv" onChange={onFile} style={{ display: "none" }} />
            </label>
            <textarea
              className="pf365"
              name="lista"
              value={lista}
              onChange={(e) => setLista(e.target.value)}
              placeholder={"Nome, E-mail, Telefone, Empresa\nMaria Oliveira, maria@ex.com, , Auto Peças Silva"}
              style={{
                width: "100%",
                height: 90,
                padding: "10px 12px",
                fontSize: 13,
                border: "1.5px solid #dde3ec",
                borderRadius: 10,
                color: "#1f2733",
                resize: "vertical",
                lineHeight: 1.5,
                background: "#fff",
              }}
            />
            <button
              type="submit"
              disabled={importing}
              style={{
                width: "100%",
                height: 40,
                marginTop: 10,
                background: "#fff",
                color: "#04377f",
                border: "1.5px solid #cdd6e4",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: importing ? "wait" : "pointer",
              }}
            >
              {importing ? "Importando…" : "Importar lista"}
            </button>
            {importState?.error && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {importState.error}</p>}
            {importState?.ok && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {importState.ok}</p>}
          </form>
        </div>
      </section>

      <section style={{ flex: "1.5 1 420px", minWidth: 320 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#6a7585" }}>{alunos.length} aluno(s)</span>
          <button
            type="button"
            onClick={exportarCSV}
            disabled={!alunos.length}
            style={{
              height: 34,
              padding: "0 14px",
              background: "#fff",
              color: "#04377f",
              border: "1.5px solid #cdd6e4",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: alunos.length ? "pointer" : "not-allowed",
              opacity: alunos.length ? 1 : 0.5,
            }}
          >
            Exportar CSV
          </button>
        </div>

        {alunos.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhum aluno cadastrado</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a94a3" }}>Use o formulário ao lado para começar.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, overflow: "hidden" }}>
            {alunos.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f2f5f9" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    flex: "none",
                    borderRadius: "50%",
                    background: "#eef4fc",
                    color: "#04377f",
                    fontWeight: 800,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {iniciais(a.nome)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1f2733", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.nome}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a94a3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[a.empresa, a.email].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                  </div>
                </div>
                <form action={deleteStudent}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    title="Remover"
                    style={{ height: 32, width: 32, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
