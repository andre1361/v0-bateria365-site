import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { linkPages } from "@/db/schema"
import { OG_CONTENT_TYPE, OG_SIZE, imagemRemota, ogCard } from "@/lib/og/card"

export const alt = "Links — Bateria 365"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [page] = await db
    .select({ titulo: linkPages.titulo, descricao: linkPages.descricao, logoUrl: linkPages.logoUrl, accent: linkPages.accent })
    .from(linkPages)
    .where(and(eq(linkPages.slug, slug), eq(linkPages.ativo, true)))

  if (!page) return ogCard({ titulo: "Bateria 365", descricao: "", rodape: "bateria365.com.br" })

  return ogCard({
    titulo: page.titulo,
    descricao: page.descricao,
    accent: page.accent,
    selo: { src: await imagemRemota(page.logoUrl), nome: page.titulo },
    rodape: `bateria365.com.br/l/${slug}`,
  })
}
