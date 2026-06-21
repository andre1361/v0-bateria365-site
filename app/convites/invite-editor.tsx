"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ConviteUniaoDiadema } from "./templates/ConviteUniaoDiadema"
import { EstamosChegando } from "./templates/EstamosChegando"

type Template = "square" | "vertical"

type Offsets = {
  badge: number
  title: number
  pill: number
  group: number
  logoX: number
  logoY: number
}

type EditorState = {
  template: Template
  cidade: string
  dataISO: string
  horario: string
  distribuidor: string
  local: string
  fundoUrl: string
  downloading: boolean
  offsets: Offsets
  savedOffsets: Offsets
}

const OFFSET_KEY = "cv_sq_offsets_v1"
const STEP = 2

// Predefinição fixada do ajuste fino de posição. A UI de ajuste está oculta
// por enquanto (SHOW_FINE_TUNE), mas a arte do convite usa sempre estes valores.
const DEFAULT_OFFSETS: Offsets = { badge: -22, title: 10, pill: 24, group: 86, logoX: 0, logoY: 12 }

// Liga/desliga a seção "Ajuste fino de posição" no editor.
const SHOW_FINE_TUNE: boolean = false

const INITIAL_STATE: EditorState = {
  template: "square",
  cidade: "São Paulo",
  dataISO: "2026-03-12",
  horario: "19h",
  distribuidor: "União",
  local: "Vivano Steak - Av. Goiás, 1135 - Santa Paula - São Caetano do Sul/SP",
  fundoUrl: "",
  downloading: false,
  offsets: { ...DEFAULT_OFFSETS },
  savedOffsets: { ...DEFAULT_OFFSETS },
}

const capLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#9298a6",
  marginBottom: 7,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  fontFamily: "inherit",
  color: "#1b2030",
  background: "#f7f8fa",
  border: "1.5px solid #e2e4ea",
  borderRadius: 11,
}

const nudgeBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9,
  border: "1.5px solid #e2e4ea",
  background: "#f7f8fa",
  color: "#081344",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  lineHeight: 1,
}

const offValue: React.CSSProperties = {
  minWidth: 46,
  textAlign: "center",
  fontSize: 12.5,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: "#081344",
}

function fmtDate(iso: string): string {
  if (!iso) return ""
  const p = String(iso).split("-")
  if (p.length !== 3) return iso
  return `${p[2]}/${p[1]}/${p[0]}`
}

function fmtOff(n: number): string {
  const v = Math.round(Number(n) || 0)
  return (v > 0 ? "+" : "") + v + " px"
}

export function InviteEditor({ logoutAction }: { logoutAction?: (formData: FormData) => void | Promise<void> }) {
  const [state, setState] = useState<EditorState>(INITIAL_STATE)
  const stageRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  const patch = useCallback((p: Partial<EditorState>) => setState((s) => ({ ...s, ...p })), [])

  const nudge = useCallback((key: keyof Offsets, delta: number) => {
    setState((s) => ({ ...s, offsets: { ...s.offsets, [key]: (Number(s.offsets[key]) || 0) + delta } }))
  }, [])

  const dims = useCallback(
    () => (state.template === "square" ? { w: 1080, h: 1076 } : { w: 1536, h: 2048 }),
    [state.template],
  )

  const fitPreview = useCallback(() => {
    const stage = stageRef.current
    const wrap = wrapRef.current
    if (!stage || !wrap) return
    const d = dims()
    const pad = 64
    const s = Math.min((stage.clientWidth - pad) / d.w, (stage.clientHeight - pad) / d.h, 1.4)
    wrap.style.width = d.w + "px"
    wrap.style.height = d.h + "px"
    wrap.style.transform = "translate(-50%,-50%) scale(" + s + ")"
  }, [dims])

  // monta: carrega predefinicao salva, escuta resize e ajusta o preview
  useEffect(() => {
    const onResize = () => fitPreview()
    window.addEventListener("resize", onResize)
    fitPreview()
    const t1 = setTimeout(fitPreview, 200)
    const t2 = setTimeout(fitPreview, 800)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => fitPreview()).catch(() => {})
    }
    try {
      const raw = SHOW_FINE_TUNE ? localStorage.getItem(OFFSET_KEY) : null
      if (raw) {
        const o = JSON.parse(raw)
        const clean: Offsets = {
          badge: Number(o.badge) || 0,
          title: Number(o.title) || 0,
          pill: Number(o.pill) || 0,
          group: Number(o.group) || 0,
          logoX: Number(o.logoX) || 0,
          logoY: Number(o.logoY) || 0,
        }
        setState((s) => ({ ...s, offsets: clean, savedOffsets: clean }))
      }
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener("resize", onResize)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [fitPreview])

  // reajusta ao trocar de modelo (dimensoes mudam)
  useEffect(() => {
    fitPreview()
  }, [state.template, fitPreview])

  const localFontSize = useMemo(() => {
    const text = "Local: " + (state.local || "")
    const max = 952
    const base = 29
    try {
      if (!measureCtxRef.current) {
        const c = document.createElement("canvas")
        measureCtxRef.current = c.getContext("2d")
      }
      const ctx = measureCtxRef.current
      if (!ctx) return base
      ctx.font = "600 " + base + "px Lato, Arial, sans-serif"
      const w = ctx.measureText(text).width
      if (w <= max) return base
      return Math.max(15, Math.floor((base * max) / w))
    } catch {
      return base
    }
  }, [state.local])

  const savePreset = useCallback(() => {
    setState((s) => {
      const o = { ...s.offsets }
      try {
        localStorage.setItem(OFFSET_KEY, JSON.stringify(o))
      } catch {
        /* ignore */
      }
      return { ...s, savedOffsets: o }
    })
  }, [])

  const restorePreset = useCallback(() => {
    setState((s) => ({ ...s, offsets: { ...s.savedOffsets } }))
  }, [])

  const resetOffsets = useCallback(() => {
    setState((s) => ({ ...s, offsets: { badge: 0, title: 0, pill: 0, group: 0, logoX: 0, logoY: 0 } }))
  }, [])

  const onFoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setState((s) => ({ ...s, fundoUrl: String(r.result || "") }))
    r.readAsDataURL(f)
  }, [])

  const download = useCallback(async () => {
    const wrap = wrapRef.current
    if (!wrap || state.downloading) return
    setState((s) => ({ ...s, downloading: true }))
    const d = state.template === "square" ? { w: 1080, h: 1076 } : { w: 1536, h: 2048 }
    const saved = {
      transform: wrap.style.transform,
      left: wrap.style.left,
      top: wrap.style.top,
      origin: wrap.style.transformOrigin,
    }
    try {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready
        } catch {
          /* ignore */
        }
      }
      // neutraliza a escala/centralizacao para capturar a arte em 1:1
      wrap.style.transform = "none"
      wrap.style.left = "0px"
      wrap.style.top = "0px"
      wrap.style.transformOrigin = "top left"
      void wrap.offsetWidth
      await new Promise((r) => setTimeout(r, 80))
      const { domToPng } = await import("modern-screenshot")
      const dataUrl = await domToPng(wrap, {
        scale: 2,
        width: d.w,
        height: d.h,
        backgroundColor: state.template === "square" ? "#081344" : "#0a0a12",
      })
      const safe =
        (state.cidade || "convite")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "convite"
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "convite-" + state.template + "-" + safe + ".png"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      console.error("Falha ao gerar PNG:", e)
    } finally {
      wrap.style.transform = saved.transform
      wrap.style.left = saved.left
      wrap.style.top = saved.top
      wrap.style.transformOrigin = saved.origin
      setState((s) => ({ ...s, downloading: false }))
      fitPreview()
    }
  }, [state.downloading, state.template, state.cidade, fitPreview])

  const isSquare = state.template === "square"
  const off = state.offsets
  const sv = state.savedOffsets
  const dirty =
    off.badge !== sv.badge ||
    off.title !== sv.title ||
    off.pill !== sv.pill ||
    off.group !== sv.group ||
    off.logoX !== sv.logoX ||
    off.logoY !== sv.logoY

  const cardBase: React.CSSProperties = {
    textAlign: "left",
    cursor: "pointer",
    padding: "14px 14px 13px",
    borderRadius: 14,
    background: "#fff",
    transition: "all .12s",
  }
  const squareCardStyle: React.CSSProperties = isSquare
    ? { ...cardBase, border: "2px solid #081344", boxShadow: "0 6px 18px -8px rgba(8,19,68,0.5)" }
    : { ...cardBase, border: "2px solid #e6e8ee" }
  const verticalCardStyle: React.CSSProperties = !isSquare
    ? { ...cardBase, border: "2px solid #081344", boxShadow: "0 6px 18px -8px rgba(8,19,68,0.5)" }
    : { ...cardBase, border: "2px solid #e6e8ee" }

  const dataFmt = fmtDate(state.dataISO)

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        fontFamily: "var(--font-lato), -apple-system, 'Segoe UI', Roboto, sans-serif",
        background: "#f4f5f7",
        color: "#1b2030",
        overflow: "hidden",
      }}
    >
      <style>{`
        #cv-fields::-webkit-scrollbar { width: 10px; }
        #cv-fields::-webkit-scrollbar-thumb { background: #d4d7e0; border-radius: 10px; border: 3px solid #fff; }
        .cv-input:focus { outline: none; border-color: #081344 !important; box-shadow: 0 0 0 3px rgba(8,19,68,0.12) !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside
        style={{
          width: 392,
          minWidth: 392,
          height: "100%",
          background: "#ffffff",
          borderRight: "1px solid #e2e4ea",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #eef0f4" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#081344",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 11,
                    height: 15,
                    background: "#FFB901",
                    clipPath: "polygon(55% 0,0 58%,42% 58%,30% 100%,100% 42%,58% 42%)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#8a90a0",
                }}
              >
                Bateria 365 · Distribuidor
              </span>
            </div>
            {logoutAction && (
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Encerrar sessão"
                  style={{
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#8a90a0",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Sair
                </button>
              </form>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900, letterSpacing: "-0.01em", color: "#081344" }}>
            Editor de Convites
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.45, color: "#6b7180" }}>
            Escolha o modelo, preencha os dados do evento e baixe a arte pronta.
          </p>
        </div>

        {/* campos */}
        <div id="cv-fields" style={{ flex: 1, overflowY: "auto", padding: "22px 28px 26px" }}>
          {/* seletor de modelo */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#9298a6",
              marginBottom: 10,
            }}
          >
            Modelo da arte
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 26 }}>
            <button type="button" onClick={() => patch({ template: "square" })} style={squareCardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 54, marginBottom: 10 }}>
                <div
                  style={{
                    width: 58,
                    height: 50,
                    borderRadius: 5,
                    background: "linear-gradient(135deg,#1b52d1,#081344)",
                    border: "2px solid " + (isSquare ? "#FFB901" : "transparent"),
                  }}
                />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1b2030" }}>Seu Convite Chegou</div>
              <div style={{ fontSize: 11.5, color: "#8a90a0", marginTop: 2 }}>Quadrado · 1080×1076</div>
            </button>

            <button type="button" onClick={() => patch({ template: "vertical" })} style={verticalCardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 54, marginBottom: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 54,
                    borderRadius: 5,
                    background: "linear-gradient(135deg,#2a83ff,#0a3d9f)",
                    border: "2px solid " + (!isSquare ? "#FFB901" : "transparent"),
                  }}
                />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1b2030" }}>Estamos Chegando</div>
              <div style={{ fontSize: 11.5, color: "#8a90a0", marginTop: 2 }}>Vertical · 1536×2048</div>
            </button>
          </div>

          {/* Cidade */}
          <label style={{ display: "block", marginBottom: 18 }}>
            <span style={capLabel}>Cidade</span>
            <input
              className="cv-input"
              type="text"
              value={state.cidade}
              onChange={(e) => patch({ cidade: e.target.value })}
              placeholder="Ex.: São Paulo"
              style={inputStyle}
            />
            <span style={{ display: "block", fontSize: 11.5, color: "#a2a7b3", marginTop: 6 }}>
              Aparece no selo “ALÔ {(state.cidade || "").toUpperCase()}”.
            </span>
          </label>

          {/* Data */}
          <label style={{ display: "block", marginBottom: 18 }}>
            <span style={capLabel}>Data do evento</span>
            <input
              className="cv-input"
              type="date"
              value={state.dataISO}
              onChange={(e) => patch({ dataISO: e.target.value })}
              style={{ ...inputStyle, padding: "11px 14px" }}
            />
            <span style={{ display: "block", fontSize: 11.5, color: "#a2a7b3", marginTop: 6 }}>
              Será exibida como {dataFmt}.
            </span>
          </label>

          {/* Campos exclusivos do modelo quadrado */}
          {isSquare && (
            <div>
              <label style={{ display: "block", marginBottom: 18 }}>
                <span style={capLabel}>Horário</span>
                <input
                  className="cv-input"
                  type="text"
                  value={state.horario}
                  onChange={(e) => patch({ horario: e.target.value })}
                  placeholder="Ex.: 19h"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "block", marginBottom: 18 }}>
                <span style={capLabel}>Nome do distribuidor</span>
                <input
                  className="cv-input"
                  type="text"
                  value={state.distribuidor}
                  onChange={(e) => patch({ distribuidor: e.target.value })}
                  placeholder="Ex.: União"
                  style={inputStyle}
                />
                <span style={{ display: "block", fontSize: 11.5, color: "#a2a7b3", marginTop: 6 }}>
                  Exibido como “Distribuidor {state.distribuidor} convida para o treinamento:”.
                </span>
              </label>

              <label style={{ display: "block", marginBottom: 18 }}>
                <span style={capLabel}>Local (endereço)</span>
                <textarea
                  className="cv-input"
                  value={state.local}
                  onChange={(e) => patch({ local: e.target.value })}
                  rows={3}
                  placeholder="Nome do espaço, rua, bairro, cidade/UF"
                  style={{ ...inputStyle, fontSize: 14, lineHeight: 1.4, resize: "vertical" }}
                />
              </label>

              <div style={{ marginBottom: 8 }}>
                <span style={capLabel}>Foto de fundo</span>
                <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                  <label
                    style={{
                      flex: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: 12,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#081344",
                      background: "#fff",
                      border: "1.5px dashed #c7ccd8",
                      borderRadius: 11,
                    }}
                  >
                    <span>{state.fundoUrl ? "Trocar foto" : "Enviar foto"}</span>
                    <input type="file" accept="image/*" onChange={onFoto} style={{ display: "none" }} />
                  </label>
                  {!!state.fundoUrl && (
                    <button
                      type="button"
                      onClick={() => patch({ fundoUrl: "" })}
                      title="Remover foto"
                      style={{
                        padding: "0 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#b13b3b",
                        background: "#fbedec",
                        border: "1.5px solid #f3d6d3",
                        borderRadius: 11,
                        cursor: "pointer",
                      }}
                    >
                      Remover
                    </button>
                  )}
                </div>
                <span style={{ display: "block", fontSize: 11.5, color: "#a2a7b3", marginTop: 8 }}>
                  Use uma foto da cidade (skyline) para personalizar o fundo.
                </span>
              </div>

              {/* Ajuste fino de posição — oculto por enquanto (valores fixados em DEFAULT_OFFSETS) */}
              {SHOW_FINE_TUNE && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px dashed #e2e4ea" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#9298a6",
                    }}
                  >
                    Ajuste fino de posição
                  </span>
                  {dirty && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        color: "#9a6800",
                        background: "#fff3d6",
                        padding: "3px 9px",
                        borderRadius: 20,
                      }}
                    >
                      não salvo
                    </span>
                  )}
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 11.5, lineHeight: 1.45, color: "#a2a7b3" }}>
                  Suba ou desça cada elemento e salve como predefinição. “Restaurar” volta ao último salvo.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {/* Selo ALÔ */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b2030" }}>Selo “ALÔ”</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button type="button" title="Subir" onClick={() => nudge("badge", -STEP)} style={nudgeBtn}>↑</button>
                      <span style={offValue}>{fmtOff(off.badge)}</span>
                      <button type="button" title="Descer" onClick={() => nudge("badge", STEP)} style={nudgeBtn}>↓</button>
                    </div>
                  </div>

                  {/* Titulo */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b2030" }}>Título</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button type="button" title="Subir" onClick={() => nudge("title", -STEP)} style={nudgeBtn}>↑</button>
                      <span style={offValue}>{fmtOff(off.title)}</span>
                      <button type="button" title="Descer" onClick={() => nudge("title", STEP)} style={nudgeBtn}>↓</button>
                    </div>
                  </div>

                  {/* Pilula Dia */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b2030" }}>Pílula “Dia”</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button type="button" title="Subir" onClick={() => nudge("pill", -STEP)} style={nudgeBtn}>↑</button>
                      <span style={offValue}>{fmtOff(off.pill)}</span>
                      <button type="button" title="Descer" onClick={() => nudge("pill", STEP)} style={nudgeBtn}>↓</button>
                    </div>
                  </div>

                  {/* Grupo inteiro */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      paddingTop: 9,
                      borderTop: "1px solid #f0f1f5",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#081344" }}>Grupo inteiro</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        title="Subir"
                        onClick={() => nudge("group", -STEP)}
                        style={{ ...nudgeBtn, border: "1.5px solid #cdd2de", background: "#eef0f6" }}
                      >
                        ↑
                      </button>
                      <span style={offValue}>{fmtOff(off.group)}</span>
                      <button
                        type="button"
                        title="Descer"
                        onClick={() => nudge("group", STEP)}
                        style={{ ...nudgeBtn, border: "1.5px solid #cdd2de", background: "#eef0f6" }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Logo Bateria 365 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      paddingTop: 9,
                      borderTop: "1px solid #f0f1f5",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1b2030" }}>
                      Logo Bateria 365
                      <br />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#a2a7b3" }}>
                        vertical {fmtOff(off.logoY)} · horizontal {fmtOff(off.logoX)}
                      </span>
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <button
                        type="button"
                        title="Subir"
                        onClick={() => nudge("logoY", -STEP)}
                        style={{ ...nudgeBtn, height: 28 }}
                      >
                        ↑
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <button
                          type="button"
                          title="Esquerda"
                          onClick={() => nudge("logoX", -STEP)}
                          style={{ ...nudgeBtn, height: 28 }}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          title="Direita"
                          onClick={() => nudge("logoX", STEP)}
                          style={{ ...nudgeBtn, height: 28 }}
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        title="Descer"
                        onClick={() => nudge("logoY", STEP)}
                        style={{ ...nudgeBtn, height: 28 }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={savePreset}
                    style={{
                      flex: 1,
                      padding: 11,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#fff",
                      background: "#081344",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Salvar predefinição
                  </button>
                  <button
                    type="button"
                    onClick={restorePreset}
                    style={{
                      padding: "11px 14px",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1b2030",
                      background: "#fff",
                      border: "1.5px solid #e2e4ea",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Restaurar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetOffsets}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: 9,
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#8a90a0",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Zerar posições
                </button>
              </div>
              )}
            </div>
          )}

          {!isSquare && (
            <div style={{ padding: "14px 16px", background: "#f3f5fb", border: "1px solid #e4e8f3", borderRadius: 11 }}>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#6b7180" }}>
                Neste modelo a arte usa apenas <strong style={{ color: "#1b2030" }}>cidade</strong> e{" "}
                <strong style={{ color: "#1b2030" }}>data</strong>. O fundo é fixo.
              </span>
            </div>
          )}
        </div>

        {/* footer / download */}
        <div style={{ padding: "18px 28px 22px", borderTop: "1px solid #eef0f4", background: "#fff" }}>
          <button
            type="button"
            onClick={download}
            disabled={state.downloading}
            style={{
              width: "100%",
              padding: 15,
              fontFamily: "inherit",
              fontSize: 15.5,
              fontWeight: 900,
              letterSpacing: "0.01em",
              color: "#081344",
              background: "#FFB901",
              border: "none",
              borderRadius: 13,
              cursor: state.downloading ? "wait" : "pointer",
              opacity: state.downloading ? 0.7 : 1,
              boxShadow: "0 8px 20px -8px rgba(255,185,1,0.9)",
            }}
          >
            {state.downloading ? "Gerando PNG…" : "Baixar convite (PNG)"}
          </button>
          <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 11.5, color: "#a2a7b3" }}>
            PNG em alta resolução, pronto para enviar.
          </p>
        </div>
      </aside>

      {/* PREVIEW */}
      <main style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            height: 58,
            minHeight: 58,
            borderBottom: "1px solid #e7e9ef",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1b2030" }}>
              {isSquare ? "Seu Convite Chegou" : "Estamos Chegando"}
            </span>
            <span style={{ fontSize: 12, color: "#9298a6" }}>· prévia ao vivo</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "#9298a6" }}>
            {isSquare ? "1080 × 1076 px" : "1536 × 2048 px"}
          </span>
        </div>

        <div
          ref={stageRef}
          id="cv-stage"
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#e9ebf0",
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(8,19,68,0.06) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          <div
            ref={wrapRef}
            id="cv-wrap"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%) scale(0.4)",
              transformOrigin: "center center",
              boxShadow: "0 30px 80px -20px rgba(8,19,68,0.45)",
              background: "#081344",
            }}
          >
            {isSquare ? (
              <ConviteUniaoDiadema
                cidade={state.cidade}
                data={dataFmt}
                horario={state.horario}
                distribuidor={state.distribuidor}
                local={state.local}
                localFontSize={localFontSize}
                fundoUrl={state.fundoUrl || ""}
                offBadge={off.badge}
                offTitle={off.title}
                offPill={off.pill}
                offGroup={off.group}
                offLogoX={off.logoX}
                offLogoY={off.logoY}
              />
            ) : (
              <EstamosChegando cidade={state.cidade} data={dataFmt} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
