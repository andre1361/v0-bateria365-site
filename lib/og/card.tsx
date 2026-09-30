import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { iniciais, readableOn } from "@/lib/cores"

// Imagem de pré-visualização (WhatsApp, Instagram, Facebook, X) no tamanho recomendado de 1200×630.
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const DIR = join(process.cwd(), "lib/og")
const AZUL = "#04377f"

async function dataUrl(path: string, mime: string) {
  return `data:${mime};base64,${(await readFile(path)).toString("base64")}`
}

// O gerador de imagem só entende PNG, JPEG e GIF; WebP e outros ficam de fora (mostra as iniciais).
export async function imagemRemota(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url || "")) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    if (!res.ok || !["image/png", "image/jpeg", "image/gif"].includes(mime)) return null
    return `data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`
  } catch {
    return null
  }
}

function cortar(texto: string, max: number) {
  const t = (texto || "").replace(/\s+/g, " ").trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t
}

type Card = {
  titulo: string
  descricao: string
  rodape: string // endereço mostrado no canto, ex.: "bateria365.com.br/codigo-radio"
  accent?: string
  selo?: { src: string | null; nome: string } // logo da página (ou iniciais do nome)
}

export async function ogCard({ titulo, descricao, rodape, accent, selo }: Card) {
  const fundo = (accent || "").trim() || AZUL
  const texto = readableOn(fundo)
  const claro = texto !== "#ffffff"
  const [regular, bold, marca] = await Promise.all([
    readFile(join(DIR, "inter-500.ttf")),
    readFile(join(DIR, "inter-800.ttf")),
    // O nome dos arquivos se refere ao fundo onde o logo é usado.
    dataUrl(join(process.cwd(), "public/images", claro ? "logo-bateria365-claro.png" : "logo-bateria365-escuro.png"), "image/png"),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: fundo,
          backgroundImage: `radial-gradient(circle at 85% 15%, ${claro ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.16)"}, rgba(255,255,255,0) 55%)`,
          color: texto,
          fontFamily: "Inter",
        }}
      >
        {/* Sobre cores claras o "365" amarelo do logo some; aí ele vai num selo branco. */}
        <div style={{ display: "flex", alignSelf: "flex-start", padding: claro ? "14px 22px" : 0, borderRadius: 16, background: claro ? "#ffffff" : "transparent" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={marca} alt="" height={44} width={Math.round((44 * 4307) / 825)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          {selo && (
            <div
              style={{
                width: 176,
                height: 176,
                flexShrink: 0,
                borderRadius: 32,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                fontWeight: 800,
                color: claro ? texto : fundo,
                boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              }}
            >
              {selo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selo.src} alt="" width={148} height={148} style={{ objectFit: "contain" }} />
              ) : (
                iniciais(selo.nome) || "365"
              )}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{cortar(titulo, 48)}</div>
            {descricao && (
              <div style={{ marginTop: 22, fontSize: 32, fontWeight: 500, lineHeight: 1.35, opacity: 0.86 }}>{cortar(descricao, 130)}</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, fontWeight: 500, opacity: 0.75 }}>{rodape}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: regular, weight: 500, style: "normal" },
        { name: "Inter", data: bold, weight: 800, style: "normal" },
      ],
    },
  )
}
