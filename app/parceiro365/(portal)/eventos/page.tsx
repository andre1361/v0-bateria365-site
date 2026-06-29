import Link from "next/link"
import { desc, eq, inArray } from "drizzle-orm"
import { ChevronRight } from "lucide-react"
import { db } from "@/db"
import { events, rsvps } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"

function fmtDate(iso: string) {
  const p = (iso || "").split("-")
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso || ""
}

export default async function TreinamentosPage() {
  const u = await requireUser()
  const evs = await db.select().from(events).where(eq(events.distributorId, u.id)).orderBy(desc(events.createdAt))
  const ids = evs.map((e) => e.id)
  const allRsvps = ids.length ? await db.select({ eventId: rsvps.eventId }).from(rsvps).where(inArray(rsvps.eventId, ids)) : []
  const treinos = evs.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    cidade: e.cidade,
    dataISO: e.dataISO,
    horario: e.horario,
    confirmados: allRsvps.filter((r) => r.eventId === e.id).length,
  }))

  return (
    <>
      <PageHeader title="Treinamentos" subtitle="Abra um treinamento para enviar o convite, ver quem vai, sortear e certificar" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 14 }}>
          {treinos.length === 0 ? (
            <div style={{ background: "#fff", border: "1px dashed #cfd7e2", borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🎓</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#41506a" }}>Nenhum treinamento ainda</div>
              <p style={{ margin: "7px 0 0", fontSize: 13, color: "#8a94a3" }}>Seus treinamentos aparecem aqui assim que forem criados para você.</p>
            </div>
          ) : (
            treinos.map((t) => (
              <Link
                key={t.id}
                href={`/parceiro365/eventos/${t.id}`}
                style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: "18px 20px", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ width: 46, height: 46, flex: "none", borderRadius: 12, background: "#eef4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎓</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2733", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.titulo}</div>
                  <div style={{ fontSize: 13, color: "#8a94a3", marginTop: 2 }}>
                    {[t.cidade, fmtDate(t.dataISO), t.horario].filter(Boolean).join(" · ") || "Sem data definida"}
                  </div>
                </div>
                <div style={{ flex: "none", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#04377f", lineHeight: 1 }}>{t.confirmados}</div>
                  <div style={{ fontSize: 11, color: "#9aa4b2", fontWeight: 700 }}>vão</div>
                </div>
                <ChevronRight size={22} color="#c3cedd" style={{ flex: "none" }} />
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  )
}
