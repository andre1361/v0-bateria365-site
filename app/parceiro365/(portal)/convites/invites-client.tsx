"use client"

import { useCallback, useEffect, useState } from "react"
import { InviteEditor, type InviteMeta, type EditorState } from "@/app/convites/invite-editor"
import { logInvite, saveInvitePhoto } from "./actions"

type EventoLite = {
  id: string
  titulo: string
  template: string
  cidade: string
  dataISO: string
  horario: string
  local: string
  fundoUrl: string
}

type Msg = { type: "ok" | "err"; text: string } | null

// Editor de convites embutido no portal, com seletor para auto-preencher os
// dados a partir de um evento cadastrado e botão para salvar a foto de fundo
// direto no convite online (link enviado às empresas).
export function InvitesClient({ eventos, distribuidorNome, initialEventId = "" }: { eventos: EventoLite[]; distribuidorNome: string; initialEventId?: string }) {
  const [eventId, setEventId] = useState(initialEventId)
  const [photo, setPhoto] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  // Fotos salvas nesta sessão (sobrepõe o valor vindo do servidor até recarregar).
  const [savedPhotos, setSavedPhotos] = useState<Record<string, string>>({})

  const ev = eventos.find((e) => e.id === eventId)
  const evFundo = ev ? (savedPhotos[ev.id] ?? ev.fundoUrl) : ""

  const initial: Partial<EditorState> | undefined = ev
    ? {
        template: ev.template === "vertical" ? "vertical" : "square",
        cidade: ev.cidade,
        dataISO: ev.dataISO || undefined,
        horario: ev.horario,
        local: ev.local,
        distribuidor: distribuidorNome,
        fundoUrl: evFundo || "",
      }
    : undefined

  const onPhotoChange = useCallback((f: string) => setPhoto(f), [])

  // Ao trocar de evento, limpa a mensagem.
  useEffect(() => {
    setMsg(null)
  }, [eventId])

  const isVertical = ev?.template === "vertical"

  const salvar = useCallback(async () => {
    if (!eventId) {
      setMsg({ type: "err", text: "Escolha um treinamento acima para salvar a foto no link." })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      let url = photo || ""
      // Foto nova = data URL (base64). Sobe para o storage e usa a URL hospedada.
      if (url.startsWith("data:")) {
        const blob = await (await fetch(url)).blob()
        const ext = (blob.type.split("/")[1] || "png").replace("+xml", "")
        const fd = new FormData()
        fd.append("file", blob, `convite.${ext}`)
        const r = await fetch("/api/upload-image", { method: "POST", body: fd })
        if (!r.ok) throw new Error("upload")
        const j = (await r.json()) as { url?: string }
        if (!j.url) throw new Error("upload")
        url = j.url
      }
      const res = await saveInvitePhoto(eventId, url)
      if (res.error) {
        setMsg({ type: "err", text: res.error })
      } else {
        setSavedPhotos((m) => ({ ...m, [eventId]: url }))
        setMsg({ type: "ok", text: url ? "Foto salva no convite online! ✅" : "Foto removida do convite online." })
      }
    } catch {
      setMsg({ type: "err", text: "Não consegui salvar a foto. Tente novamente." })
    } finally {
      setSaving(false)
    }
  }, [eventId, photo])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {eventos.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #e6eaf1", background: "#fff", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#41506a", whiteSpace: "nowrap" }}>Preencher de um evento:</span>
          <select
            className="pf365"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1.5px solid #dde3ec", borderRadius: 9, color: "#1f2733", background: "#fff", maxWidth: 360 }}
          >
            <option value="">— nenhum (em branco) —</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titulo}
              </option>
            ))}
          </select>

          <div style={{ flex: 1 }} />

          {msg && (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: msg.type === "ok" ? "#1f7a4d" : "#c0392b" }}>{msg.text}</span>
          )}
          <button
            type="button"
            onClick={salvar}
            disabled={saving || !eventId || isVertical}
            title={
              isVertical
                ? "O modelo vertical usa arte fixa e não aceita foto personalizada."
                : !eventId
                  ? "Escolha um treinamento para salvar a foto no link."
                  : "Salvar a foto atual no convite online deste treinamento."
            }
            style={{
              height: 36,
              padding: "0 16px",
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
              background: saving || !eventId || isVertical ? "#9fb2cc" : "#04377f",
              border: "none",
              borderRadius: 9,
              cursor: saving || !eventId || isVertical ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {saving ? "Salvando…" : "💾 Salvar foto no convite online"}
          </button>
        </div>
      )}

      {ev && isVertical && (
        <div style={{ padding: "8px 16px", background: "#fff8e6", borderBottom: "1px solid #f2e6c2", fontSize: 12, color: "#8a6d1a" }}>
          O modelo <strong>vertical</strong> usa arte fixa — a foto personalizada só vale no modelo <strong>quadrado</strong>.
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <InviteEditor
          key={eventId || "blank"}
          embedded
          initial={initial}
          onPhotoChange={onPhotoChange}
          onGenerated={(meta: InviteMeta) => {
            logInvite(meta).catch(() => {})
          }}
        />
      </div>
    </div>
  )
}
