import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"
import { CalendarDays, MapPin, BookOpen, User, Instagram } from "lucide-react"
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

  const igHandle = (ev.instagram || "").replace(/^@+/, "")
  const detalhes = [
    ev.dataISO ? { icon: CalendarDays, label: "Data", value: dataFmt + (ev.horario ? ` · ${ev.horario}` : "") } : null,
    ev.local ? { icon: MapPin, label: "Local", value: ev.local } : null,
    ev.modulo ? { icon: BookOpen, label: "Módulo", value: ev.modulo } : null,
    ev.responsavel ? { icon: User, label: "Responsável", value: ev.responsavel } : null,
  ].filter(Boolean) as { icon: typeof CalendarDays; label: string; value: string }[]

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#eef1f6 0%,#dde6f2 100%)", color: "#1f2733" }}>
      <div style={{ height: 56, background: "#04377f", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f9b801", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#04377f", fontSize: 12 }}>365</div>
        <span style={{ fontWeight: 800 }}>Parceiro <span style={{ color: "#f9b801" }}>365</span></span>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px 64px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#04377f", textAlign: "center", marginBottom: 10 }}>
          Você está convidado(a)
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 14, boxShadow: "0 18px 50px -18px rgba(8,33,72,0.45)", border: "1px solid #e6eaf1" }}>
          <InvitePreview template={ev.template} data={artData} />
        </div>

        <h1 style={{ margin: "22px 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" }}>{ev.titulo}</h1>
        {ev.cidade && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#eef4fc", color: "#04377f", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
              <MapPin size={14} /> {ev.cidade}
            </span>
          </div>
        )}

        {(detalhes.length > 0 || igHandle) && (
          <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: "6px 18px", marginTop: 20, boxShadow: "0 8px 24px -16px rgba(8,33,72,0.4)" }}>
            {detalhes.map((d, i) => {
              const Icon = d.icon
              return (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: i < detalhes.length - 1 || igHandle ? "1px solid #f0f2f6" : "none" }}>
                  <div style={{ width: 40, height: 40, flex: "none", borderRadius: 11, background: "#eef4fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={19} color="#04377f" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9298a6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.label}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "#1f2733" }}>{d.value}</div>
                  </div>
                </div>
              )
            })}
            {igHandle && (
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, flex: "none", borderRadius: 11, background: "#fdeef5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Instagram size={19} color="#c13584" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9298a6", textTransform: "uppercase", letterSpacing: "0.05em" }}>Instagram</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#c13584" }}>@{igHandle}</div>
                </div>
              </a>
            )}
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 18, padding: 24, marginTop: 20, boxShadow: "0 10px 30px -18px rgba(8,33,72,0.45)" }}>
          <RsvpForm slug={slug} />
        </div>

        <p style={{ textAlign: "center", fontSize: 11.5, color: "#9298a6", marginTop: 22 }}>
          Convite gerado por <strong style={{ color: "#6a7585" }}>Parceiro 365</strong> · Bateria 365
        </p>
      </div>
    </div>
  )
}
