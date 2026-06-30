"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createLinkPage, deleteLinkPage, type LinkPageState } from "./actions"

type Pg = { id: string; titulo: string; slug: string; abas: number; itens: number }
const initial: LinkPageState = {}

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

export function LinksClient({ pages }: { pages: Pg[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createLinkPage, initial)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => setOrigin(window.location.origin), [])
  useEffect(() => {
    if (state.id) router.push(`/parceiro365/admin/links/${state.id}`)
  }, [state, router])

  const linkDe = (slug: string) => `${origin}/l/${slug}`
  const copiar = (slug: string) => {
    navigator.clipboard?.writeText(linkDe(slug))
    setCopied(slug)
    setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1800)
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1080 }}>
      <section style={{ flex: "1 1 300px", maxWidth: 360, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Nova página de links</h2>
        <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "#6a7585" }}>Crie e depois monte as abas e os links.</p>
        <form action={action}>
          <label style={label}>
            Título <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="titulo" placeholder="Ex.: Materiais do treinamento" style={field} required />
          <button
            type="submit"
            disabled={pending}
            style={{ width: "100%", height: 46, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.75 : 1 }}
          >
            {pending ? "Criando…" : "Criar página"}
          </button>
          {state?.error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}
        </form>
      </section>

      <section style={{ flex: "1.5 1 420px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6a7585" }}>{pages.length} página(s)</div>
        {pages.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhuma página ainda</div>
            <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "#8a94a3" }}>Crie uma página ao lado para começar.</p>
          </div>
        ) : (
          pages.map((p) => (
            <div key={p.id} style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2733" }}>{p.titulo}</div>
                  <div style={{ fontSize: 12.5, color: "#8a94a3", marginTop: 2 }}>
                    {p.abas} aba(s) · {p.itens} link(s)
                  </div>
                </div>
                <Link
                  href={`/parceiro365/admin/links/${p.id}`}
                  style={{ height: 30, display: "inline-flex", alignItems: "center", padding: "0 12px", background: "#04377f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                >
                  Editar
                </Link>
                <form action={deleteLinkPage}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    title="Excluir"
                    onClick={(ev) => {
                      if (!confirm(`Excluir a página "${p.titulo}"? O link público deixará de funcionar.`)) ev.preventDefault()
                    }}
                    style={{ height: 30, width: 30, background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </form>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                <input readOnly value={linkDe(p.slug)} style={{ flex: 1, minWidth: 0, height: 36, padding: "0 12px", fontSize: 12.5, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#04377f", background: "#f7f9fc", fontWeight: 600 }} />
                <button type="button" onClick={() => copiar(p.slug)} style={{ height: 36, padding: "0 14px", background: "#04377f", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {copied === p.slug ? "Copiado!" : "Copiar"}
                </button>
                <a href={linkDe(p.slug)} target="_blank" rel="noreferrer" style={{ height: 36, display: "inline-flex", alignItems: "center", padding: "0 14px", background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                  Abrir
                </a>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
