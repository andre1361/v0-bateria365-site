"use client"

import { useState } from "react"
import type { LinkTab } from "@/db/schema"

export type LinkHubData = { titulo: string; descricao: string; logoUrl: string; accent: string; tabs: LinkTab[] }

function iniciais(nome: string) {
  return (nome || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
}

export function LinkHub({ data, embedded }: { data: LinkHubData; embedded?: boolean }) {
  const accent = (data.accent || "").trim() || "#04377f"
  const tabs = (data.tabs || []).filter((t) => t && t.nome !== undefined)
  const [active, setActive] = useState(0)
  const idx = active < tabs.length ? active : 0
  const items = (tabs[idx]?.items || []).filter((i) => (i.titulo || "").trim() || (i.url || "").trim())

  return (
    <div
      style={
        embedded
          ? { padding: "22px 14px", background: "linear-gradient(180deg,#eef1f6,#dde6f2)", borderRadius: 14 }
          : { minHeight: "100vh", background: "linear-gradient(180deg,#eef1f6 0%,#dde6f2 100%)", padding: "36px 16px 64px" }
      }
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt={data.titulo}
              style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px", display: "block", border: "3px solid #fff", boxShadow: "0 8px 24px -10px rgba(8,33,72,0.45)" }}
            />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: "50%", margin: "0 auto 14px", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800 }}>
              {iniciais(data.titulo) || "365"}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", color: "#1f2733" }}>{data.titulo || "Sua página"}</h1>
          {data.descricao && <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6a7585", lineHeight: 1.5 }}>{data.descricao}</p>}
        </div>

        {tabs.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "22px 0 4px" }}>
            {tabs.map((t, i) => {
              const on = i === idx
              return (
                <button
                  key={t.id || i}
                  type="button"
                  onClick={() => setActive(i)}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: on ? "none" : "1.5px solid #cdd6e4",
                    background: on ? accent : "#fff",
                    color: on ? "#fff" : "#41506a",
                  }}
                >
                  {t.nome || "Aba"}
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", fontSize: 13.5, color: "#9aa4b2", padding: "24px 0" }}>Nenhum link nesta aba ainda.</div>
          ) : (
            items.map((it, i) => (
              <a
                key={it.id || i}
                href={(it.url || "").trim() || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  background: "#fff",
                  border: "1px solid #e6eaf1",
                  borderLeft: `4px solid ${accent}`,
                  borderRadius: 14,
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 8px 22px -16px rgba(8,33,72,0.4)",
                }}
              >
                {it.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imagem} alt="" style={{ width: 46, height: 46, flex: "none", borderRadius: 10, objectFit: "cover", background: "#eef4fc" }} />
                ) : (
                  <div style={{ width: 46, height: 46, flex: "none", borderRadius: 10, background: "#eef4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
                )}
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: "#1f2733" }}>{it.titulo || it.url || "Link"}</span>
                <span style={{ flex: "none", color: accent, fontSize: 18, fontWeight: 800 }}>›</span>
              </a>
            ))
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 11.5, color: "#9298a6", marginTop: 28 }}>
          Feito com <strong style={{ color: "#6a7585" }}>Bateria 365</strong>
        </div>
      </div>
    </div>
  )
}
