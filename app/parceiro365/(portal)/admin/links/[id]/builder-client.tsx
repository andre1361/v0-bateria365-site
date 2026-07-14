"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { LinkTab } from "@/db/schema"
import { saveLinkPage } from "../actions"
import { LinkHub } from "@/app/l/link-hub"
import { ImageUploadField } from "./image-upload-field"

type PageData = { id: string; titulo: string; descricao: string; slug: string; logoUrl: string; accent: string; tabs: LinkTab[] }

const genId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const field: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", fontSize: 14, border: "1.5px solid #dde3ec", borderRadius: 10, color: "#1f2733", background: "#fff" }
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", margin: "0 0 5px" }
const mini: React.CSSProperties = { width: "100%", height: 38, padding: "0 10px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#1f2733", background: "#fff" }
const iconBtn: React.CSSProperties = { height: 30, width: 30, flex: "none", background: "#fff", border: "1.5px solid #dde3ec", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#41506a" }
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 18, marginBottom: 16 }

export function BuilderClient({ page }: { page: PageData }) {
  const [titulo, setTitulo] = useState(page.titulo)
  const [descricao, setDescricao] = useState(page.descricao)
  const [slug, setSlug] = useState(page.slug)
  const [logoUrl, setLogoUrl] = useState(page.logoUrl)
  const [accent, setAccent] = useState(page.accent || "")
  const [tabs, setTabs] = useState<LinkTab[]>(page.tabs?.length ? page.tabs : [{ id: genId("t"), nome: "Links", items: [] }])
  const [active, setActive] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({})
  const [origin, setOrigin] = useState("")
  useEffect(() => setOrigin(window.location.origin), [])

  const at = active < tabs.length ? active : 0
  const tab = tabs[at]

  const addTab = () => {
    setTabs((prev) => [...prev, { id: genId("t"), nome: "Nova aba", items: [] }])
    setActive(tabs.length)
  }
  const renameTab = (i: number, nome: string) => setTabs((prev) => prev.map((t, idx) => (idx === i ? { ...t, nome } : t)))
  const removeTab = (i: number) => {
    if (tabs.length <= 1) {
      setMsg({ error: "Deixe ao menos uma aba." })
      return
    }
    if (!confirm("Excluir esta aba e os links dela?")) return
    setTabs((prev) => prev.filter((_, idx) => idx !== i))
    setActive((a) => (a >= i && a > 0 ? a - 1 : a))
  }
  const moveTab = (i: number, dir: number) => {
    const j = i + dir
    if (j < 0 || j >= tabs.length) return
    setTabs((prev) => {
      const n = [...prev]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
    setActive(j)
  }

  const updItems = (fn: (items: LinkTab["items"]) => LinkTab["items"]) =>
    setTabs((prev) => prev.map((t, idx) => (idx === at ? { ...t, items: fn(t.items) } : t)))
  const addItem = () => updItems((items) => [...items, { id: genId("i"), titulo: "", url: "", imagem: "" }])
  const updItem = (k: number, key: "titulo" | "url" | "imagem", value: string) =>
    updItems((items) => items.map((it, idx) => (idx === k ? { ...it, [key]: value } : it)))
  const removeItem = (k: number) => updItems((items) => items.filter((_, idx) => idx !== k))
  const moveItem = (k: number, dir: number) =>
    updItems((items) => {
      const j = k + dir
      if (j < 0 || j >= items.length) return items
      const n = [...items]
      ;[n[k], n[j]] = [n[j], n[k]]
      return n
    })

  const salvar = async () => {
    setSaving(true)
    setMsg({})
    try {
      const res = await saveLinkPage({ id: page.id, titulo, descricao, slug, logoUrl, accent, tabs })
      if (res.error) setMsg({ error: res.error })
      else {
        setMsg({ ok: res.ok })
        if (res.slug) setSlug(res.slug)
      }
    } catch {
      setMsg({ error: "Não foi possível salvar." })
    } finally {
      setSaving(false)
    }
  }

  const publicUrl = `${origin}/l/${slug}`

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1180 }}>
      {/* Construtor */}
      <section style={{ flex: "1 1 380px", maxWidth: 460, minWidth: 320 }}>
        <Link href="/parceiro365/admin/links" style={{ display: "inline-block", marginBottom: 12, fontSize: 12.5, fontWeight: 700, color: "#04377f", textDecoration: "none" }}>
          ← Voltar para páginas
        </Link>

        {/* Dados */}
        <div style={card}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 800 }}>Dados da página</h3>
          <label style={label}>Título</label>
          <input className="pf365" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Materiais do treinamento" style={{ ...field, marginBottom: 12 }} />
          <label style={label}>Descrição</label>
          <input className="pf365" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Acesse os materiais abaixo" style={{ ...field, marginBottom: 12 }} />
          <label style={label}>Logo (URL da imagem)</label>
          <input className="pf365" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" style={{ ...field, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: "0 0 92px" }}>
              <label style={label}>Cor</label>
              <input type="color" value={accent || "#04377f"} onChange={(e) => setAccent(e.target.value)} style={{ width: "100%", height: 42, border: "1.5px solid #dde3ec", borderRadius: 10, background: "#fff", cursor: "pointer" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Endereço do link</label>
              <div style={{ display: "flex", alignItems: "center", height: 42, border: "1.5px solid #dde3ec", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                <span style={{ padding: "0 8px", fontSize: 13, color: "#9aa4b2", whiteSpace: "nowrap" }}>/l/</span>
                <input className="pf365" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1, minWidth: 0, height: "100%", border: "none", padding: "0 8px 0 0", fontSize: 14, color: "#1f2733", background: "transparent" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800 }}>Abas</h3>
            <button type="button" onClick={addTab} style={{ height: 30, padding: "0 12px", background: "#eef4fc", color: "#04377f", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              + Nova aba
            </button>
          </div>
          {tabs.map((t, i) => {
            const on = i === at
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <button type="button" onClick={() => setActive(i)} title="Editar esta aba" style={{ ...iconBtn, width: 30, background: on ? "#04377f" : "#fff", color: on ? "#fff" : "#41506a", border: on ? "none" : "1.5px solid #dde3ec" }}>
                  {on ? "✏" : i + 1}
                </button>
                <input className="pf365" value={t.nome} onChange={(e) => renameTab(i, e.target.value)} placeholder="Nome da aba" style={{ ...mini, flex: 1 }} />
                <button type="button" onClick={() => moveTab(i, -1)} title="Subir" style={iconBtn}>↑</button>
                <button type="button" onClick={() => moveTab(i, 1)} title="Descer" style={iconBtn}>↓</button>
                <button type="button" onClick={() => removeTab(i)} title="Excluir aba" style={{ ...iconBtn, color: "#c0392b", borderColor: "#ecdcd9" }}>×</button>
              </div>
            )
          })}
        </div>

        {/* Itens da aba ativa */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800 }}>Links da aba “{tab?.nome || ""}”</h3>
            <button type="button" onClick={addItem} style={{ height: 30, padding: "0 12px", background: "#eef4fc", color: "#04377f", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              + Novo link
            </button>
          </div>
          {(tab?.items || []).length === 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#8a94a3" }}>Nenhum link nesta aba. Clique em “Novo link”.</p>
          ) : (
            (tab?.items || []).map((it, k) => (
              <div key={it.id} style={{ border: "1px solid #eef1f5", borderRadius: 12, padding: 12, marginTop: 10, background: "#fbfcfe" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#9298a6" }}>Link {k + 1}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => moveItem(k, -1)} title="Subir" style={iconBtn}>↑</button>
                    <button type="button" onClick={() => moveItem(k, 1)} title="Descer" style={iconBtn}>↓</button>
                    <button type="button" onClick={() => removeItem(k)} title="Excluir" style={{ ...iconBtn, color: "#c0392b", borderColor: "#ecdcd9" }}>×</button>
                  </div>
                </div>
                <input className="pf365" value={it.titulo} onChange={(e) => updItem(k, "titulo", e.target.value)} placeholder="Título (ex.: Instagram da loja)" style={{ ...mini, marginBottom: 8 }} />
                <input className="pf365" value={it.url} onChange={(e) => updItem(k, "url", e.target.value)} placeholder="Link (https://…)" style={{ ...mini, marginBottom: 8 }} />
                <ImageUploadField value={it.imagem} onChange={(url) => updItem(k, "imagem", url)} />
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={salvar} disabled={saving} style={{ height: 46, padding: "0 24px", background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.75 : 1 }}>
            {saving ? "Salvando…" : "Salvar página"}
          </button>
          {msg.ok && <span style={{ fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {msg.ok}</span>}
          {msg.error && <span style={{ fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {msg.error}</span>}
        </div>
      </section>

      {/* Prévia + link público */}
      <section style={{ flex: "1.2 1 360px", minWidth: 300 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Link público</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input readOnly value={publicUrl} style={{ flex: 1, minWidth: 0, height: 38, padding: "0 12px", fontSize: 12.5, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#04377f", background: "#f7f9fc", fontWeight: 600 }} />
          <button type="button" onClick={() => navigator.clipboard?.writeText(publicUrl)} style={{ height: 38, padding: "0 14px", background: "#04377f", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Copiar</button>
          <a href={publicUrl} target="_blank" rel="noreferrer" style={{ height: 38, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>Abrir</a>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Prévia</div>
        <div style={{ border: "1px solid #e6eaf1", borderRadius: 16, overflow: "hidden" }}>
          <LinkHub data={{ titulo, descricao, logoUrl, accent, tabs }} embedded />
        </div>
        <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: "#9aa4b2" }}>A prévia atualiza enquanto você edita. Clique em “Salvar página” para publicar.</p>
      </section>
    </div>
  )
}
