import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, users } from "@/db/schema"
import { InvitePreview } from "@/app/convites/invite-preview"
import { RsvpForm } from "./rsvp-form"

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false, follow: false },
}

function fmtDate(iso: string) {
  const p = (iso || "").split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso || ""
}

export default async function ConvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await db
    .select({ ev: events, distNome: users.nome })
    .from(events)
    .innerJoin(users, eq(users.id, events.distributorId))
    .where(and(eq(events.slug, slug), eq(events.ativo, true)))
  const row = rows[0]

  if (!row) {
    return (
      <div style={{ minHeight: "100vh", background: "#eef1f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Convite não encontrado</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#6a7585" }}>Este link de convite não existe ou foi desativado.</p>
        </div>
      </div>
    )
  }

  const ev = row.ev
  const dataFmt = fmtDate(ev.dataISO)
  const artData =
    ev.template === "vertical"
      ? { cidade: ev.cidade, data: dataFmt }
      : {
          cidade: ev.cidade,
          data: dataFmt,
          horario: ev.horario,
          distribuidor: row.distNome,
          local: ev.local,
          offBadge: -22,
          offTitle: 10,
          offPill: 24,
          offGroup: 86,
          offLogoX: 0,
          offLogoY: 12,
        }

  const detalhes = [
    ev.dataISO ? { label: "Data", value: dataFmt + (ev.horario ? ` · ${ev.horario}` : "") } : null,
    ev.local ? { label: "Local", value: ev.local } : null,
    ev.modulo ? { label: "Módulo", value: ev.modulo } : null,
    ev.responsavel ? { label: "Responsável", value: ev.responsavel } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  const igHandle = (ev.instagram || "").replace(/^@+/, "")

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <div style={{ height: 56, background: "#04377f", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f9b801", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#04377f", fontSize: 12 }}>365</div>
        <span style={{ fontWeight: 800 }}>Parceiro <span style={{ color: "#f9b801" }}>365</span></span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "22px 16px 56px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 14, boxShadow: "0 10px 34px rgba(16,33,60,0.10)", border: "1px solid #e6eaf1" }}>
          <InvitePreview template={ev.template} data={artData} />
        </div>

        <h1 style={{ margin: "20px 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>{ev.titulo}</h1>
        {ev.cidade && <p style={{ margin: 0, textAlign: "center", fontSize: 14, color: "#6a7585" }}>{ev.cidade}</p>}

        {detalhes.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: 18, marginTop: 18 }}>
            {detalhes.map((d) => (
              <div key={d.label} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #f3f5f9", fontSize: 14 }}>
                <span style={{ width: 96, flex: "none", fontWeight: 700, color: "#8a94a3" }}>{d.label}</span>
                <span style={{ color: "#1f2733" }}>{d.value}</span>
              </div>
            ))}
            {igHandle && (
              <div style={{ display: "flex", gap: 10, padding: "7px 0", fontSize: 14 }}>
                <span style={{ width: 96, flex: "none", fontWeight: 700, color: "#8a94a3" }}>Instagram</span>
                <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer" style={{ color: "#04377f", fontWeight: 600, textDecoration: "none" }}>
                  @{igHandle}
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22, marginTop: 18 }}>
          <RsvpForm slug={slug} />
        </div>
      </div>
    </div>
  )
}
