import type { Metadata } from "next"
import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { emitLinks, users } from "@/db/schema"
import { emitCookieName, emitToken } from "./emit-lib"
import { EmitGate } from "./emit-gate"
import { EmitClient } from "./emitir-client"

export const metadata: Metadata = {
  title: "Emissão de certificado",
  robots: { index: false, follow: false },
}

export default async function EmitirPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await db
    .select({ senhaHash: emitLinks.senhaHash, nome: users.nome, cidade: users.cidade })
    .from(emitLinks)
    .innerJoin(users, eq(users.id, emitLinks.distributorId))
    .where(and(eq(emitLinks.slug, slug), eq(emitLinks.ativo, true)))
  const row = rows[0]

  let authed = false
  if (row) {
    const c = await cookies()
    authed = c.get(emitCookieName(slug))?.value === emitToken(row.senhaHash, slug)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <div style={{ height: 64, background: "#04377f", display: "flex", alignItems: "center", padding: "0 22px", gap: 11, color: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-bateria365-escuro.png" alt="Bateria 365" style={{ height: 32, width: "auto" }} />
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#bcd0ec" }}>Emissão de certificado</span>
      </div>

      {!row ? (
        <div
          style={{
            maxWidth: 420,
            margin: "8vh auto 0",
            background: "#fff",
            border: "1px solid #e3e7ee",
            borderRadius: 18,
            padding: 34,
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Link inválido</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#6a7585" }}>Este link de emissão não existe ou foi desativado.</p>
        </div>
      ) : authed ? (
        <EmitClient slug={slug} distribuidor={row.nome} cidade={row.cidade} />
      ) : (
        <EmitGate slug={slug} />
      )}
    </div>
  )
}
