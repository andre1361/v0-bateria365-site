"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { aceitarProposta } from "./actions"

const base: React.CSSProperties = { height: 48, padding: "0 22px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }

export function Aceite({ slug, visto }: { slug: string; visto: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  const confirmar = () =>
    iniciar(async () => {
      setErro(null)
      const r = await aceitarProposta(slug, visto)
      if (r.error) setErro(r.error)
      router.refresh()
    })

  return (
    <div className="nao-imprimir" style={{ marginTop: 18, textAlign: "center" }}>
      {!confirmando ? (
        <button type="button" onClick={() => setConfirmando(true)} style={{ ...base, width: "100%", background: "#1e7b3c", color: "#fff", border: "none" }}>
          Aceitar proposta
        </button>
      ) : (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>Confirma o aceite? O treinamento entra na sua agenda do Parceiro 365.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={confirmar} disabled={pendente} style={{ ...base, background: "#1e7b3c", color: "#fff", border: "none", opacity: pendente ? 0.75 : 1 }}>
              {pendente ? "Confirmando…" : "Confirmar aceite"}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} disabled={pendente} style={{ ...base, background: "#fff", color: "#41506a", border: "1.5px solid #dde3ec" }}>
              Voltar
            </button>
          </div>
        </div>
      )}
      {erro && <div role="alert" style={{ marginTop: 10, fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{erro}</div>}
    </div>
  )
}
