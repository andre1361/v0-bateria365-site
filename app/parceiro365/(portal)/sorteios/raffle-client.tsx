"use client"

import { useEffect, useRef, useState } from "react"
import { saveRaffle } from "./actions"

type Part = { id: string; nome: string }

export function RaffleClient({ alunos }: { alunos: string[] }) {
  const [participantes, setParticipantes] = useState<Part[]>([])
  const [novoPart, setNovoPart] = useState("")
  const [historico, setHistorico] = useState<string[]>([])
  const [destaque, setDestaque] = useState("")
  const [rolando, setRolando] = useState(false)
  const [semRepeticao, setSemRepeticao] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current) }, [])

  const ganhos = new Set(historico.map((h) => h.toLowerCase()))
  const pool = semRepeticao ? participantes.filter((p) => !ganhos.has(p.nome.toLowerCase())) : participantes

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
    const novos = alunos
      .filter((n) => !existentes.has(n.toLowerCase()))
      .map((n, i) => ({ id: "a" + i + "_" + n, nome: n }))
    if (novos.length) setParticipantes((prev) => [...prev, ...novos])
  }

  const sortear = () => {
    if (rolando) return
    if (!pool.length) return
    const winner = pool[Math.floor(Math.random() * pool.length)].nome
    const DURACAO = 2200
    const inicio = Date.now()
    setRolando(true)
    setSavedMsg("")
    if (spinRef.current) clearInterval(spinRef.current)
    spinRef.current = setInterval(() => {
      if (Date.now() - inicio >= DURACAO) {
        if (spinRef.current) clearInterval(spinRef.current)
        setDestaque(winner)
        setRolando(false)
        setHistorico((prev) => [winner, ...prev])
        return
      }
      setDestaque(pool[Math.floor(Math.random() * pool.length)].nome)
    }, 80)
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

  const ganhadorAtual = historico[0] || ""
  const displayNome = rolando ? destaque || "—" : ganhadorAtual || "Pronto para sortear"
  const displayStyle: React.CSSProperties = rolando
    ? { fontSize: 30, fontWeight: 800, color: "#fff", opacity: 0.92 }
    : ganhadorAtual
      ? { fontSize: 34, fontWeight: 800, color: "#f9b801", textShadow: "0 2px 14px rgba(249,184,1,0.35)" }
      : { fontSize: 22, fontWeight: 700, color: "#9fbbe0" }
  const disabled = rolando || pool.length === 0

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
          <button type="button" onClick={addParticipante} style={{ width: 42, flex: "none", height: 42, background: "#04377f", color: "#fff", border: "none", borderRadius: 10, fontSize: 20, cursor: "pointer" }}>
            +
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button type="button" onClick={importarAlunos} disabled={!alunos.length} style={{ flex: 1, height: 36, background: "#fff", color: "#04377f", border: "1.5px solid #cdd6e4", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: alunos.length ? "pointer" : "not-allowed", opacity: alunos.length ? 1 : 0.5 }}>
            Importar alunos
          </button>
          <button type="button" onClick={() => { setParticipantes([]); setHistorico([]); setDestaque(""); setSavedMsg("") }} style={{ flex: "none", height: 36, padding: "0 12px", background: "#fff", color: "#c0392b", border: "1.5px solid #ecdcd9", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
                {won && <span style={{ fontSize: 11, fontWeight: 700, color: "#0f7a43" }}>✓ sorteado</span>}
                <button type="button" onClick={() => setParticipantes((prev) => prev.filter((x) => x.id !== p.id))} style={{ background: "none", border: "none", color: "#aab3c0", fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            )
          })}
        </div>
      </section>

      {/* sorteador */}
      <section style={{ flex: "1.6 1 420px", minWidth: 320 }}>
        <div style={{ background: "linear-gradient(160deg,#04377f,#022a5f)", borderRadius: 18, padding: "34px 28px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#9fbbe0", textTransform: "uppercase" }}>Sorteador Parceiro 365</div>
          <div style={{ margin: "22px auto", minHeight: 88, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={displayStyle}>{displayNome}</div>
          </div>
          <button
            type="button"
            onClick={sortear}
            disabled={disabled}
            style={{ height: 52, padding: "0 40px", border: "none", borderRadius: 13, fontSize: 16, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#9fbbe0" : "#f9b801", color: disabled ? "#eaf1fb" : "#04377f" }}
          >
            {rolando ? "Sorteando…" : historico.length ? "Sortear novamente" : "Sortear agora"}
          </button>
        </div>

        {historico.length > 0 && (
          <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#41506a" }}>Sorteados ({historico.length})</span>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#6a7585", cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={semRepeticao} onChange={(e) => setSemRepeticao(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#04377f" }} />
                Sem repetição
              </label>
            </div>
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
              <button type="button" onClick={() => { setHistorico([]); setDestaque(""); setSavedMsg("") }} style={{ flex: "none", height: 38, padding: "0 14px", background: "#fff", color: "#6a7585", border: "1.5px solid #dde3ec", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Reiniciar
              </button>
            </div>
            {savedMsg && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>{savedMsg}</p>}
          </div>
        )}
      </section>
    </div>
  )
}
