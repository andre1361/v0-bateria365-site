"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { parseListFile, parseXlsx, type ParsedList } from "../sorteios/parse-list"
import { importCompanies, type ImportRow, type ImportResult } from "./actions"

type TargetKey = "nome" | "cidade" | "responsavel" | "telefone" | "email" | "observacoes"
const TARGETS: { key: TargetKey; label: string; required?: boolean; kw: RegExp }[] = [
  { key: "nome", label: "Nome da empresa", required: true, kw: /revenda|empresa|nome|razao|raz|cliente|loja/ },
  { key: "cidade", label: "Cidade", kw: /cidade|munic|local/ },
  { key: "responsavel", label: "Responsável", kw: /propriet|respons|contato|dono|titular/ },
  { key: "telefone", label: "Telefone", kw: /tel|fone|celular|whats/ },
  { key: "email", label: "E-mail", kw: /mail/ },
  { key: "observacoes", label: "Observações", kw: /obs|cpf|cnpj|document|nota/ },
]

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
}

function autoMap(fields: string[]): Record<TargetKey, string> {
  const used = new Set<string>()
  const map = {} as Record<TargetKey, string>
  for (const t of TARGETS) {
    const hit = fields.find((f) => !used.has(f) && t.kw.test(norm(f)))
    map[t.key] = hit || ""
    if (hit) used.add(hit)
  }
  return map
}

const box: React.CSSProperties = { height: 34, padding: "0 8px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 8, color: "#1f2733", background: "#fff", maxWidth: 220 }

export function ImportCompanies() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState("")
  const [parsed, setParsed] = useState<ParsedList | null>(null)
  const [map, setMap] = useState<Record<TargetKey, string>>({} as Record<TargetKey, string>)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const rows: ImportRow[] = useMemo(() => {
    if (!parsed) return []
    return parsed.records
      .map((rec) => {
        const r: ImportRow = { nome: "" }
        for (const t of TARGETS) {
          const src = map[t.key]
          if (src) (r as Record<string, string>)[t.key] = rec[src] || ""
        }
        return r
      })
      .filter((r) => (r.nome || "").trim() !== "")
  }, [parsed, map])

  async function onFile(file: File) {
    setErr("")
    setResult(null)
    setParsed(null)
    setFileName(file.name)
    const lower = file.name.toLowerCase()
    try {
      let p: ParsedList
      if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
        p = await parseXlsx(await file.arrayBuffer())
      } else if (lower.endsWith(".xls")) {
        setErr("Formato .xls antigo não é suportado. Salve como .xlsx ou CSV.")
        return
      } else {
        p = parseListFile(file.name, await file.text())
      }
      if (!p.fields.length || !p.records.length) {
        setErr("Não consegui ler linhas neste arquivo. Confira se tem cabeçalho e dados.")
        return
      }
      setParsed(p)
      setMap(autoMap(p.fields))
    } catch {
      setErr("Falha ao ler o arquivo. Tente um CSV ou .xlsx.")
    }
  }

  async function doImport() {
    if (!rows.length) return
    setBusy(true)
    setErr("")
    try {
      const res = await importCompanies(rows)
      setResult(res)
      if (!res.error && res.imported > 0) router.refresh()
    } catch {
      setErr("Não consegui importar. Tente novamente.")
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setParsed(null)
    setFileName("")
    setResult(null)
    setErr("")
    if (inputRef.current) inputRef.current.value = ""
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", fontSize: 13.5, fontWeight: 800, color: "#04377f", background: "#eef4fc", border: "1.5px solid #d6e3f5", borderRadius: 10, cursor: "pointer" }}
        >
          ⬆️ Importar empresas (CSV/Excel)
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 16, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Importar empresas</h2>
        <button type="button" onClick={() => { setOpen(false); reset() }} style={{ fontSize: 13, fontWeight: 700, color: "#6a7585", background: "none", border: "none", cursor: "pointer" }}>
          Fechar ✕
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", fontSize: 13, fontWeight: 700, color: "#081344", background: "#fff", border: "1.5px dashed #c7ccd8", borderRadius: 10, cursor: "pointer" }}>
          <span>{fileName ? "Trocar arquivo" : "Escolher arquivo (.csv, .xlsx)"}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xlsm,.xml,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
            }}
            style={{ display: "none" }}
          />
        </label>
        {fileName && <span style={{ fontSize: 12.5, color: "#6a7585" }}>{fileName}</span>}
      </div>

      {err && <div style={{ marginTop: 12, fontSize: 13, color: "#c0392b", fontWeight: 600 }}>⚠ {err}</div>}

      {parsed && !result && (
        <>
          <div style={{ marginTop: 16, fontSize: 12.5, color: "#41506a" }}>
            Detectei <strong>{parsed.records.length}</strong> linha(s). Confira a associação das colunas:
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10, marginTop: 10 }}>
            {TARGETS.map((t) => (
              <label key={t.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#41506a" }}>
                  {t.label} {t.required && <span style={{ color: "#c0392b" }}>*</span>}
                </span>
                <select value={map[t.key] || ""} onChange={(e) => setMap((m) => ({ ...m, [t.key]: e.target.value }))} style={{ ...box, maxWidth: "100%" }}>
                  <option value="">— ignorar —</option>
                  {parsed.fields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* Prévia */}
          <div style={{ marginTop: 14, overflowX: "auto", border: "1px solid #eef1f5", borderRadius: 10 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {TARGETS.filter((t) => map[t.key]).map((t) => (
                    <th key={t.key} style={{ textAlign: "left", padding: "8px 10px", color: "#6a7585", fontWeight: 800, whiteSpace: "nowrap", borderBottom: "1px solid #eef1f5" }}>
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((r, i) => (
                  <tr key={i}>
                    {TARGETS.filter((t) => map[t.key]).map((t) => (
                      <td key={t.key} style={{ padding: "7px 10px", borderBottom: "1px solid #f4f6f9", whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {(r as Record<string, string>)[t.key] || <span style={{ color: "#c3c9d4" }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 6 && <div style={{ fontSize: 12, color: "#8a94a3", marginTop: 6 }}>… e mais {rows.length - 6} empresa(s).</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={doImport}
              disabled={busy || !map.nome || rows.length === 0}
              style={{ height: 42, padding: "0 20px", fontSize: 14, fontWeight: 800, color: "#fff", background: busy || !map.nome || rows.length === 0 ? "#9fb2cc" : "#04377f", border: "none", borderRadius: 10, cursor: busy || !map.nome || rows.length === 0 ? "not-allowed" : "pointer" }}
            >
              {busy ? "Importando…" : `Importar ${rows.length} empresa(s)`}
            </button>
            {!map.nome && <span style={{ fontSize: 12.5, color: "#c0392b" }}>Associe a coluna do nome da empresa.</span>}
            <span style={{ fontSize: 12, color: "#8a94a3" }}>Empresas já cadastradas (mesmo nome) são ignoradas.</span>
          </div>
        </>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.error ? (
            <div style={{ fontSize: 13.5, color: "#c0392b", fontWeight: 700 }}>⚠ {result.error}</div>
          ) : (
            <div style={{ background: "#eaf7ef", border: "1px solid #cde9d8", borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: "#1f7a4d", fontWeight: 700 }}>
              ✅ {result.imported} empresa(s) importada(s).{" "}
              {result.skipped > 0 && <span style={{ color: "#8a6d1a", fontWeight: 600 }}>{result.skipped} ignorada(s) (duplicadas ou sem nome).</span>}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button type="button" onClick={reset} style={{ height: 38, padding: "0 16px", fontSize: 13, fontWeight: 700, color: "#04377f", background: "#eef4fc", border: "1.5px solid #d6e3f5", borderRadius: 9, cursor: "pointer" }}>
              Importar outro arquivo
            </button>
            <button type="button" onClick={() => { setOpen(false); reset() }} style={{ height: 38, padding: "0 16px", fontSize: 13, fontWeight: 700, color: "#6a7585", background: "#fff", border: "1.5px solid #dde3ec", borderRadius: 9, cursor: "pointer" }}>
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
