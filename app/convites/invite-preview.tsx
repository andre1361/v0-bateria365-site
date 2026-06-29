"use client"

import { useEffect, useRef, useState } from "react"
import { ConviteUniaoDiadema } from "./templates/ConviteUniaoDiadema"
import { EstamosChegando } from "./templates/EstamosChegando"

// Renderiza a arte do convite (tamanho nativo) escalada para caber na largura
// do container. Reaproveitado na página pública do convite.
export function InvitePreview({ template, data }: { template: string; data: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  const isSquare = template !== "vertical"
  const w = isSquare ? 1080 : 1536
  const h = isSquare ? 1076 : 2048
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / w)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])

  return (
    <div ref={ref} style={{ width: "100%", height: h * scale, position: "relative", overflow: "hidden", borderRadius: 12 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {isSquare ? <ConviteUniaoDiadema {...data} /> : <EstamosChegando {...data} />}
      </div>
    </div>
  )
}
