"use client"

import { useRef, useState, useCallback } from "react"

interface Props {
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

export function ImageUploadField({ value, onChange, placeholder = "Imagem/ícone (URL, opcional)" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload-image", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Erro no upload")
      onChange(json.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro no upload")
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ""
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items
    for (const item of Array.from(items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) upload(file)
        return
      }
    }
    // text paste (URL) — let it through normally
  }, [upload])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) upload(file)
  }, [upload])

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 38,
    padding: "0 10px",
    fontSize: 13,
    border: `1.5px solid ${dragging ? "#04377f" : "#dde3ec"}`,
    borderRadius: "9px 0 0 9px",
    color: "#1f2733",
    background: dragging ? "#eef4fc" : "#fff",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "stretch" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          className="pf365"
          value={uploading ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={uploading ? "Enviando…" : placeholder}
          disabled={uploading}
          style={inputStyle}
        />
        <button
          type="button"
          title="Selecionar arquivo de imagem"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            height: 38,
            padding: "0 10px",
            background: "#f0f4fa",
            border: "1.5px solid #dde3ec",
            borderLeft: "none",
            borderRadius: "0 9px 9px 0",
            cursor: uploading ? "wait" : "pointer",
            color: "#41506a",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {uploading ? (
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #cdd6e4", borderTop: "2px solid #04377f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
      {error && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#c0392b" }}>{error}</p>}
      {value && !uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <img src={value} alt="" style={{ height: 28, width: 28, objectFit: "cover", borderRadius: 6, border: "1px solid #e6eaf1", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#9aa4b2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
          <button type="button" onClick={() => onChange("")} style={{ marginLeft: "auto", flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 13, padding: 2 }} title="Remover imagem">×</button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
