"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, ne } from "drizzle-orm"
import { db } from "@/db"
import { linkPages, type LinkTab } from "@/db/schema"
import { requireAdmin } from "../../../guard"

export type LinkPageState = { error?: string; ok?: string; id?: string }
export type SaveResult = { error?: string; ok?: string; slug?: string }

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function createLinkPage(_prev: LinkPageState, formData: FormData): Promise<LinkPageState> {
  await requireAdmin()
  const titulo = String(formData.get("titulo") || "").trim()
  if (!titulo) return { error: "Informe o título da página." }
  const slug = (slugify(titulo) || "pagina") + "-" + randomUUID().replace(/-/g, "").slice(0, 5)
  const tabs: LinkTab[] = [{ id: "t" + randomUUID().replace(/-/g, "").slice(0, 8), nome: "Links", items: [] }]
  const [row] = await db.insert(linkPages).values({ titulo, slug, tabs }).returning({ id: linkPages.id })
  revalidatePath("/parceiro365/admin/links")
  return { ok: "Página criada.", id: row?.id }
}

export async function saveLinkPage(input: {
  id: string
  titulo: string
  descricao: string
  slug: string
  logoUrl: string
  accent: string
  tabs: LinkTab[]
}): Promise<SaveResult> {
  await requireAdmin()
  const id = String(input?.id || "")
  if (!id) return { error: "Página inválida." }
  const titulo = String(input.titulo || "").trim()
  if (!titulo) return { error: "Informe o título da página." }

  const slug = slugify(input.slug || titulo) || "pagina"
  const dup = await db.select({ id: linkPages.id }).from(linkPages).where(and(eq(linkPages.slug, slug), ne(linkPages.id, id)))
  if (dup.length) return { error: "Esse endereço (slug) já está em uso. Escolha outro." }

  const tabs: LinkTab[] = Array.isArray(input.tabs)
    ? input.tabs.map((t) => ({
        id: String(t?.id || "") || "t" + randomUUID().replace(/-/g, "").slice(0, 8),
        nome: String(t?.nome || "").trim() || "Aba",
        items: Array.isArray(t?.items)
          ? t.items.map((it) => ({
              id: String(it?.id || "") || "i" + randomUUID().replace(/-/g, "").slice(0, 8),
              titulo: String(it?.titulo || "").trim(),
              url: String(it?.url || "").trim(),
              imagem: String(it?.imagem || "").trim(),
            }))
          : [],
      }))
    : []

  await db
    .update(linkPages)
    .set({
      titulo,
      descricao: String(input.descricao || "").trim(),
      slug,
      logoUrl: String(input.logoUrl || "").trim(),
      accent: String(input.accent || "").trim(),
      tabs,
    })
    .where(eq(linkPages.id, id))

  revalidatePath("/parceiro365/admin/links")
  revalidatePath(`/parceiro365/admin/links/${id}`)
  revalidatePath(`/l/${slug}`)
  return { ok: "Página salva.", slug }
}

export async function deleteLinkPage(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get("id") || "")
  if (!id) return
  await db.delete(linkPages).where(eq(linkPages.id, id))
  revalidatePath("/parceiro365/admin/links")
}
