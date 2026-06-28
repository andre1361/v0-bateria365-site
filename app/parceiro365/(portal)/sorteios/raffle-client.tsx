"use client"

import { useEffect, useRef, useState } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { saveRaffle } from "./actions"

type Part = { id: string; nome: string }

async function fireConfetti() {
  try {
    const confetti = (await import("canvas-confetti")).default
    const colors = ["#f9b801", "#04377f", "#ffffff", "#2a83ff"]
    confetti({ particleCount: 180, spread: 95, startVelocity: 45, origin: { y: 0.55 }, colors })
    setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 90, origin: { x: 0, y: 0.6 }, colors }), 180)
    setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 90, origin: { x: 1, y: 0.6 }, colors }), 320)
  } catch {
    /* ignore */
  }
}

export function RaffleClient({ alunos }: { alunos: string[] }) {
  const [participantes, setParticipantes] = useState<Part[]>([])
  const [novoPart, setNovoPart] = useState("")
  const [historico, setHistorico] = useState<string[]>([])
  const [semRepeticao, setSemRepeticao] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [reel, setReel] = useState<string[]>([])
  const [targetIndex, setTargetIndex] = useState(0)
  const [transitionOn, setTransitionOn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const winnerRef = useRef("")

  const ganhos = new Set(historico.map((h) => h.toLowerCase()))
  const pool = semRepeticao ? participantes.filter((p) => !ganhos.has(p.nome.toLowerCase())) : participantes
  const ganhadorAtual = historico[0] || ""

  useEffect(() => {
    // ESC sai da tela cheia
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const addParticipante = () => {
    const n = novoPart.trim()
    if (!n) return
    if (participantes.some((p) => p.nome.toLowerCase() === n.toLowerCase())) {
      setNovoPart("")
      return
    }
    setParticipantes((prev) => [...prev, { id: "p" + prev.length + "_" + n, nome: n }])
    setNovoPart("")
  }

  const importarAlunos = () => {
    const existentes = new Set(participantes.map((p) => p.nome.toLowerCase()))
    const novos = alunos.filter((n) => !existentes.has(n.toLowerCase())).map((n, i) => ({ id: "a" + i + "_" + n, nome: n }))
    if (novos.length) setParticipantes((prev) => [...prev, ...novos])
  }

  const sortear = () => {
    if (spinning || !pool.length) return
    const winner = pool[Math.floor(Math.random() * pool.length)].nome
    winnerRef.current = winner
    const strip: string[] = Array.from({ length: 32 }, () => pool[Math.floor(Math.random() * pool.length)].nome)
    strip.push(winner)
    setReel(strip)
    setTransitionOn(false)
    setTargetIndex(0)
    setSpinning(true)
    setSavedMsg("")
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setTransitionOn(true)
        setTargetIndex(strip.length - 1)
      }),
    )
  }

  const onReelEnd = () => {
    if (!spinning) return
    setSpinning(false)
    setHistorico((prev) => [winnerRef.current, ...prev])
    fireConfetti()
  }

  const salvar = async () => {
    if (!historico.length || saving) return
    setSaving(true)
    try {
      const res = await saveRaffle({
        participantes: participantes.map((p) => p.nome),
        ganhadores: [...historico].reverse(),
        semRepeticao,
      })
      setSavedMsg(res.ok ? "Sorteio salvo no painel." : "Nada para salvar.")
    } catch {
      setSavedMsg("Não foi possível salvar.")
    } finally {
      setSaving(false)
    }
  }

  const disabled = spinning || pool.length === 0

  // ---- Sorteador (reutilizado inline e em tela cheia) ----
  const sorteador = (big: boolean) => {
    const ITEM = big ? 132 : 92
    const showReel = reel.length > 0
    return (
      <div
        style={{
          background: "linear-gradient(160deg,#04377f,#022a5f)",
          borderRadius: big ? 0 : 18,
          padding: big ? "0 24px" : "30px 26px",
          textAlign: "center",
          color: "#fff",
          minHeight: big ? "100vh" : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: big ? 28 : 18,
          position: "relative",
        }}
      >
        <div style={{ fontSize: big ? 15 : 12, fontWeight: 700, letterSpacing: "0.16em", color: "#9fbbe0", textTransform: "uppercase" }}>
          Sorteador Parceiro 365
        </div>

        {/* janela da roleta */}
        <div
          style={{
            width: "100%",
            maxWidth: big ? 820 : 520,
            height: ITEM,
            overflow: "hidden",
            position: "relative",
            borderTop: "2px solid rgba(249,184,1,0.5)",
            borderBottom: "2px solid rgba(249,184,1,0.5)",
            maskImage: "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)",
            WebkitMaskImage: "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)",
          }}
        >
          {showReel ? (
            <div
              onTransitionEnd={onReelEnd}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${-(targetIndex * ITEM)}px)`,
                transition: transitionOn ? "transform 3.6s cubic-bezier(.12,.62,.16,1)" : "none",
              }}
            >
              {reel.map((nome, i) => {
                const isWinner = !spinning && i === targetIndex
                return (
                  <div
                    key={i}
                    style={{
                      height: ITEM,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 16px",
                      fontSize: big ? 52 : 30,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      color: isWinner ? "#f9b801" : "#fff",
                      textShadow: isWinner ? "0 2px 26px rgba(249,184,1,0.55)" : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }}
                  >
                    {nome}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: ITEM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: big ? 30 : 22, fontWeight: 700, color: "#9fbbe0" }}>
              Pronto para sortear
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={sortear}
          disabled={disabled}
          style={{
            height: big ? 64 : 52,
            padding: big ? "0 56px" : "0 40px",
            border: "none",
            borderRadius: 14,
            fontSize: big ? 20 : 16,
            fontWeight: 800,
            cursor: disabled ? "not-allowed" : "pointer",
            background: disabled ? "#9fbbe0" : "#f9b801",
            color: disabled ? "#eaf1fb" : "#04377f",
            boxShadow: disabled ? "none" : "0 10px 30px -8px rgba(249,184,1,0.8)",
          }}
        >
          {spinning ? "Sorteando…" : historico.length ? "Sortear novamente" : "Sortear agora"}
        </button>

        <div style={{ fontSize: big ? 14 : 12.5, color: "#9fbbe0" }}>{pool.length} disponível(is) na urna</div>

        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          disabled={spinning}
          style={{
            position: "absolute",
            top: big ? 20 : 14,
            right: big ? 20 : 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 38,
            padding: "0 14px",
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: spinning ? "not-allowed" : "pointer",
          }}
        >
          {big ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          {big ? "Sair da tela cheia" : "Tela cheia"}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1080 }}>
      {/* participantes */}
      <section style={{ flex: "1 1 300px", maxWidth: 340, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 20 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Participantes</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="pf365"
            value={novoPart}
            onChange={(e) => setNovoPart(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addParticipante() }}
            placeholder="Nome do participante"
            style={{ flex: 1, minWidth: 0, height: 42, padding: "0 13px", fontSize: 14, border: "1.5px solid #dde3ec", borderRadius: 10, color: "#1f2733" }}
          />
          <button type="button" onClick={addParticipante} style={{ width: 42, flex: "none", height: 42, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 20, cursor: "pointer" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button type="button" onClick={importarAlunos} disabled={!alunos.length} style={{ flex: 1, height: 36, background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: alunos.length ? "pointer" : "not-allowed", opacity: alunos.length ? 1 : 0.5 }}>
            Importar alunos
          </button>
          <button type="button" onClick={() => { setParticipantes([]); setHistorico([]); setReel([]); setSavedMsg("") }} style={{ flex: "none", height: 36, padding: "0 12px", background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Limpar
          </button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a3", marginBottom: 8 }}>{participantes.length} na urna</div>
        <div style={{ maxHeight: 300, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {participantes.map((p) => {
            const won = ganhos.has(p.nome.toLowerCase())
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: won ? "#f0faf4" : "#f7f9fc", border: `1px solid ${won ? "#cdecd9" : "#eaeef4"}`, borderRadius: 9, fontSize: 13 }}>
                <span style={{ flex: 1, color: won ? "#0f7a43" : "#1f2733", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</span>
                {won && <span style={{ fontSize: 11, fontWeight: 700, color: "#0f7a43" }}>✓</span>}
                <button type="button" onClick={() => setParticipantes((prev) => prev.filter((x) => x.id !== p.id))} style={{ background: "none", border: "none", color: "#aab3c0", fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            )
          })}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#6a7585", cursor: "pointer", userSelect: "none", marginTop: 14 }}>
          <input type="checkbox" checked={semRepeticao} onChange={(e) => setSemRepeticao(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#04377f" }} />
          Sem repetição
        </label>
      </section>

      {/* sorteador + histórico */}
      <section style={{ flex: "1.6 1 420px", minWidth: 320 }}>
        {sorteador(false)}

        {historico.length > 0 && (
          <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#41506a", marginBottom: 12 }}>Sorteados ({historico.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {historico.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 13px", background: "#f7faff", border: "1px solid #e4ecf6", borderRadius: 9 }}>
                  <div style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", background: "#f9b801", color: "#04377f", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{historico.length - i}</div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1f2733" }}>{h}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={salvar} disabled={saving} style={{ flex: 1, height: 38, background: "#04377f", color: "#fff", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.75 : 1 }}>
                {saving ? "Salvando…" : "Salvar no painel"}
              </button>
              <button type="button" onClick={() => { setHistorico([]); setReel([]); setSavedMsg("") }} style={{ flex: "none", height: 38, padding: "0 14px", background: "#fff", color: "#6a7585", border: "1.5px solid #dde3ec", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Reiniciar
              </button>
            </div>
            {savedMsg && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>{savedMsg}</p>}
          </div>
        )}
      </section>

      {/* overlay tela cheia */}
      {fullscreen && <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>{sorteador(true)}</div>}
    </div>
  )
}
