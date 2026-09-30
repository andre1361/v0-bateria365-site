import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { linkPages } from "@/db/schema"
import { LinkHub } from "../link-hub"

const NOINDEX = { index: false, follow: false }

// Cada página de links tem título, descrição e imagem próprios na pré-visualização (a imagem vem de opengraph-image.tsx).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [page] = await db
    .select({ titulo: linkPages.titulo, descricao: linkPages.descricao })
    .from(linkPages)
    .where(and(eq(linkPages.slug, slug), eq(linkPages.ativo, true)))
  if (!page) return { title: "Links", robots: NOINDEX }
  const title = page.titulo
  const description = page.descricao.trim() || `Todos os links de ${page.titulo} em um só lugar.`
  return {
    title,
    description,
    robots: NOINDEX,
    openGraph: { title, description, url: `/l/${slug}`, siteName: "Bateria 365", locale: "pt_BR", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [`/l/${slug}/opengraph-image`] },
  }
}

export default async function LinkPagePublic({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [page] = await db
    .select()
    .from(linkPages)
    .where(and(eq(linkPages.slug, slug), eq(linkPages.ativo, true)))

  if (!page) {
    return (
      <div style={{ minHeight: "100vh", background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Página não encontrada</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#6a7585" }}>Este link não existe ou foi desativado.</p>
        </div>
      </div>
    )
  }

  return <LinkHub data={{ titulo: page.titulo, descricao: page.descricao, logoUrl: page.logoUrl, accent: page.accent, tabs: page.tabs }} />
}
