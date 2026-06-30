import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/db"
import { linkPages } from "@/db/schema"
import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { BuilderClient } from "./builder-client"

export default async function LinkBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [page] = await db.select().from(linkPages).where(eq(linkPages.id, id))
  if (!page) notFound()

  return (
    <>
      <PageHeader title="Montar página de links" subtitle={page.titulo} />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <BuilderClient
          page={{ id: page.id, titulo: page.titulo, descricao: page.descricao, slug: page.slug, logoUrl: page.logoUrl, accent: page.accent, tabs: page.tabs }}
        />
      </main>
    </>
  )
}
