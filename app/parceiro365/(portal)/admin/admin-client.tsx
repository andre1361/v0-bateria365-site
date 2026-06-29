"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { createDistributor, toggleDistributor, deleteDistributor, getDistributorLogin, resetDistributorPassword, type AdminState } from "./actions"

type Dist = { id: string; nome: string; email: string; cidade: string; ativo: boolean }

const initial: AdminState = {}

const field: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  border: "1.5px solid #dde3ec",
  borderRadius: 10,
  marginBottom: 14,
  color: "#1f2733",
  background: "#fff",
}
const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#41506a",
  marginBottom: 6,
}

export function AdminClient({ distribuidores }: { distribuidores: Dist[] }) {
  const [state, action, pending] = useActionState(createDistributor, initial)
  const [origin, setOrigin] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  useEffect(() => setOrigin(window.location.origin), [])

  const enviarLogin = async (id: string) => {
    setBusyId(id)
    try {
      let data = await getDistributorLogin(id)
      if ("error" in data) {
        alert(data.error)
        return
      }
      if (!data.senha) {
        if (!confirm("A senha deste distribuidor não está guardada (cadastro antigo). Gerar uma nova senha agora? A senha anterior deixará de funcionar.")) return
        const reset = await resetDistributorPassword(id)
        if ("error" in reset) {
          alert(reset.error)
          return
        }
        data = reset
      }
      const msg = [
        "Olá! 👋",
        "",
        "Você agora tem acesso à plataforma *Parceiro 365* da Bateria 365.",
        "",
        `Distribuidora: *${data.nome}*`,
        "",
        "Na plataforma você pode gerenciar os convites por empresa, os alunos e os sorteios dos seus treinamentos.",
        "",
        `🔗 Acesse: ${origin}/parceiro365`,
        `📧 E-mail: ${data.email}`,
        `🔑 Senha: ${data.senha}`,
        "",
        "Qualquer dúvida, é só chamar! 💛",
      ].join("\n")
      await navigator.clipboard?.writeText(msg)
      setCopiedId(id)
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2400)
    } catch {
      alert("Não foi possível copiar os dados de login.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1080 }}>
      <section
        style={{
          flex: "1 1 320px",
          maxWidth: 380,
          background: "#fff",
          border: "1px solid #e6eaf1",
          borderRadius: 16,
          padding: 22,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Novo distribuidor</h2>
        <form action={action}>
          <label style={label}>
            Nome <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="nome" placeholder="Distribuidor Catarinense Moura" style={field} required />

          <label style={label}>
            E-mail <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input className="pf365" name="email" type="email" placeholder="distribuidor@empresa.com" style={field} required />

          <label style={label}>Cidade</label>
          <input className="pf365" name="cidade" placeholder="Florianópolis" style={field} />

          <label style={label}>
            Senha <span style={{ color: "#d6442f" }}>*</span>
          </label>
          <input
            className="pf365"
            name="senha"
            type="text"
            placeholder="mín. 6 caracteres"
            style={{ ...field, marginBottom: 18 }}
            required
          />

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 46,
              background: "#04377f",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: pending ? "wait" : "pointer",
              opacity: pending ? 0.75 : 1,
            }}
          >
            {pending ? "Cadastrando…" : "Cadastrar distribuidor"}
          </button>

          {state?.error && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</p>}
          {state?.ok && <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#0f7a43", fontWeight: 600 }}>✓ {state.ok}</p>}
        </form>
      </section>

      <section style={{ flex: "1.5 1 420px", minWidth: 320 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6a7585", marginBottom: 12 }}>
          {distribuidores.length} distribuidor(es)
        </div>

        {distribuidores.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px dashed #cfd7e2",
              borderRadius: 14,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#41506a" }}>Nenhum distribuidor cadastrado</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a94a3" }}>Use o formulário ao lado para começar.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, overflow: "hidden" }}>
            {distribuidores.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid #f2f5f9",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1f2733" }}>
                    {d.nome}
                    {!d.ativo && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#9a6700" }}>(inativo)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a94a3" }}>
                    {[d.email, d.cidade].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => enviarLogin(d.id)}
                  disabled={busyId === d.id}
                  title="Copiar mensagem de acesso para enviar no WhatsApp"
                  style={{
                    height: 32,
                    padding: "0 12px",
                    background: copiedId === d.id ? "#0f7a43" : "#f9b801",
                    color: copiedId === d.id ? "#fff" : "#04377f",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: busyId === d.id ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedId === d.id ? "✓ Copiado!" : busyId === d.id ? "…" : "Enviar login"}
                </button>
                <Link
                  href={`/parceiro365/admin/${d.id}`}
                  style={{ height: 32, display: "inline-flex", alignItems: "center", padding: "0 12px", background: "#04377f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                >
                  Treinamentos
                </Link>
                <form action={toggleDistributor}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="ativo" value={String(d.ativo)} />
                  <button
                    type="submit"
                    style={{
                      height: 32,
                      padding: "0 12px",
                      background: "#fff",
                      color: "#04377f",
                      border: "1.5px solid #cdd6e4",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {d.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <form action={deleteDistributor}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    title="Excluir"
                    style={{
                      height: 32,
                      width: 32,
                      background: "#fff",
                      color: "#c0392b",
                      border: "1.5px solid #ecdcd9",
                      borderRadius: 8,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
