import { desc } from "drizzle-orm"
import { db } from "@/db"
import { linkPages } from "@/db/schema"
import { PageHeader } from "../../../page-header"
import { requireAdmin } from "../../../guard"
import { LinksClient } from "./links-client"

export default async function AdminLinksPage() {
  await requireAdmin()
  const rows = await db.select().from(linkPages).orderBy(desc(linkPages.createdAt))
  const pages = rows.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    abas: (p.tabs || []).length,
    itens: (p.tabs || []).reduce((n, t) => n + (t.items?.length || 0), 0),
  }))

  return (
    <>
      <PageHeader title="Páginas de links" subtitle="Páginas públicas (estilo Linktree) para compartilhar materiais" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <LinksClient pages={pages} />
      </main>
    </>
  )
}
