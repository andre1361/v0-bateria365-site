"use client"

import { useState } from "react"
import type { LinkTab } from "@/db/schema"

export type LinkHubData = { titulo: string; descricao: string; logoUrl: string; accent: string; tabs: LinkTab[] }

const FONT = 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function iniciais(nome: string) {
  return (nome || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
}

function normHex(hex: string) {
  const h = (hex || "").replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
function rgba(hex: string, a: number) {
  const c = normHex(hex)
  return c ? `rgba(${c.r},${c.g},${c.b},${a})` : `rgba(4,55,122,${a})`
}
// Preto ou branco conforme a luminância — mantém contraste sobre a cor de destaque.
function readableOn(hex: string) {
  const c = normHex(hex)
  if (!c) return "#ffffff"
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
  return L > 0.52 ? "#16202f" : "#ffffff"
}
function domainOf(url: string) {
  try {
    const u = new URL((url || "").startsWith("http") ? url : "https://" + url)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function LinkHub({ data, embedded }: { data: LinkHubData; embedded?: boolean }) {
  const accent = (data.accent || "").trim() || "#04377f"
  const onAccent = readableOn(accent)
  const tabs = (data.tabs || []).filter((t) => t && t.nome !== undefined)
  const [active, setActive] = useState(0)
  const idx = active < tabs.length ? active : 0
  const items = (tabs[idx]?.items || []).filter((i) => (i.titulo || "").trim() || (i.url || "").trim())

  const rootStyle: React.CSSProperties = {
    fontFamily: FONT,
    background: `radial-gradient(125% 48% at 50% -8%, ${rgba(accent, 0.24)} 0%, rgba(255,255,255,0) 58%), linear-gradient(180deg, #eef2f8 0%, #e6ecf4 100%)`,
    color: "#16202f",
    width: "100%",
    maxWidth: "100vw",
    overflowX: "clip",
    boxSizing: "border-box",
    ...(embedded ? { padding: "24px 14px 28px" } : { minHeight: "100vh", padding: "clamp(28px, 7vw, 56px) 18px 56px" }),
    ["--lh-accent" as string]: accent,
    ["--lh-on" as string]: onAccent,
  }

  return (
    <div className="lh-root" style={rootStyle}>
      <style>{`
        .lh-root *{box-sizing:border-box}
        .lh-link{display:flex;align-items:center;gap:14px;padding:11px 12px;background:#fff;border:1px solid #e7ecf3;border-radius:18px;box-shadow:0 6px 20px -14px rgba(16,33,60,.5);text-decoration:none;color:inherit;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
        .lh-link:hover{transform:translateY(-2px);box-shadow:0 16px 32px -16px rgba(16,33,60,.55);border-color:var(--lh-accent)}
        .lh-link:active{transform:translateY(0) scale(.99)}
        .lh-link:focus-visible{outline:2.5px solid var(--lh-accent);outline-offset:2px}
        .lh-arrow{transition:transform .16s ease,background .16s ease,color .16s ease,border-color .16s ease}
        .lh-link:hover .lh-arrow{transform:translateX(3px);background:var(--lh-accent);color:var(--lh-on);border-color:var(--lh-accent)}
        .lh-tab{transition:background .14s ease,color .14s ease}
        .lh-tab:hover.lh-off{background:#e9eef6}
        .lh-tabs{scrollbar-width:none}
        .lh-tabs::-webkit-scrollbar{display:none}
        @media (prefers-reduced-motion: reduce){
          .lh-link,.lh-arrow,.lh-tab{transition:none!important}
          .lh-link:hover{transform:none}
          .lh-link:hover .lh-arrow{transform:none}
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center" }}>
          {data.logoUrl ? (
            <div style={{ width: 96, height: 96, margin: "0 auto 16px", borderRadius: 26, background: "#fff", padding: 10, boxShadow: "0 14px 34px -14px rgba(8,33,72,.4), 0 0 0 1px rgba(16,33,60,.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logoUrl} alt={data.titulo} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 16 }} />
            </div>
          ) : (
            <div style={{ width: 96, height: 96, margin: "0 auto 16px", borderRadius: 26, background: `linear-gradient(150deg, ${accent}, ${rgba(accent, 0.72)})`, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", boxShadow: "0 14px 34px -14px rgba(8,33,72,.45)" }}>
              {iniciais(data.titulo) || "365"}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: "clamp(22px, 6vw, 27px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#101d31", lineHeight: 1.15 }}>{data.titulo || "Sua página"}</h1>
          {data.descricao && <p style={{ margin: "9px auto 0", maxWidth: 380, fontSize: 15, color: "#5a6579", lineHeight: 1.55 }}>{data.descricao}</p>}
        </div>

        {/* Abas (segmented control) */}
        {tabs.length > 1 && (
          <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "24px 0 8px" }}>
            {tabs.map((t, i) => {
              const on = i === idx
              return (
                <button
                  key={t.id || i}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`lh-tab ${on ? "lh-on" : "lh-off"}`}
                  style={{
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 999,
                    fontSize: 13.5,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    border: on ? "none" : "1.5px solid rgba(16,33,60,0.12)",
                    background: on ? accent : "rgba(255,255,255,0.9)",
                    color: on ? onAccent : "#41506a",
                    boxShadow: on ? "0 8px 18px -8px rgba(16,33,60,.45)" : "0 2px 8px -7px rgba(16,33,60,.5)",
                  }}
                >
                  {t.nome || "Aba"}
                </button>
              )
            })}
          </div>
        )}

        {/* Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", fontSize: 14, color: "#94a0b2", padding: "28px 0" }}>Nenhum link nesta aba ainda.</div>
          ) : (
            items.map((it, i) => {
              const dom = domainOf(it.url)
              return (
                <a
                  key={it.id || i}
                  className="lh-link"
                  href={(it.url || "").trim() || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${it.titulo || it.url || "Link"} — abre em nova aba`}
                >
                  {it.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imagem} alt="" style={{ width: 52, height: 52, flex: "none", borderRadius: 14, objectFit: "cover", background: "#eef4fc" }} />
                  ) : (
                    <div style={{ width: 52, height: 52, flex: "none", borderRadius: 14, background: `linear-gradient(150deg, ${rgba(accent, 0.16)}, ${rgba(accent, 0.08)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* Sem imagem → ícone de link (placeholder) */}
                      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#14202f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>{it.titulo || it.url || "Link"}</div>
                    {dom && <div style={{ fontSize: 12, color: "#8a95a6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{dom}</div>}
                  </div>
                  <span
                    className="lh-arrow"
                    aria-hidden
                    style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", border: `1.5px solid ${rgba(accent, 0.28)}`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, background: "#fff" }}
                  >
                    ↗
                  </span>
                </a>
              )
            })
          )}
        </div>

        {/* Rodapé — mensagem de agradecimento */}
        <div style={{ textAlign: "center", marginTop: 34 }}>
          <div style={{ width: 40, height: 3, borderRadius: 999, background: rgba(accent, 0.28), margin: "0 auto 14px" }} />
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "#5a6579", lineHeight: 1.5 }}>
            Obrigado por participar do nosso treinamento.
          </p>
        </div>
      </div>
    </div>
  )
}
