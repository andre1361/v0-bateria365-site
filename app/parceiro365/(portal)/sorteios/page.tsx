import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { students, events, rsvps } from "@/db/schema"
import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"
import { RaffleClient } from "./raffle-client"

export default async function SorteiosPage({ searchParams }: { searchParams: Promise<{ treino?: string }> }) {
  const u = await requireUser()
  const sp = await searchParams
  const treino = (sp?.treino || "").trim()

  const rows = await db.select({ nome: students.nome }).from(students).where(eq(students.distributorId, u.id)).orderBy(asc(students.nome))
  const alunos = rows.map((r) => r.nome)

  let participantesIniciais: string[] = []
  let treinoTitulo = ""
  if (treino) {
    const [ev] = await db
      .select({ id: events.id, titulo: events.titulo })
      .from(events)
      .where(and(eq(events.id, treino), eq(events.distributorId, u.id)))
    if (ev) {
      const conf = await db.select({ nome: rsvps.nome }).from(rsvps).where(eq(rsvps.eventId, ev.id))
      participantesIniciais = conf.map((c) => c.nome).filter(Boolean)
      treinoTitulo = ev.titulo
    }
  }

  return (
    <>
      <PageHeader title="Sorteio" subtitle={treinoTitulo ? `Presentes de: ${treinoTitulo}` : "Sorteador ao vivo"} />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <RaffleClient alunos={alunos} participantesIniciais={participantesIniciais} />
      </main>
    </>
  )
}
