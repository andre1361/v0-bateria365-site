"use client"

import { useActionState } from "react"
import { loginAction, type LoginState } from "./actions"

const initial: LoginState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial)

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "radial-gradient(120% 120% at 80% 0%, #0a4a96 0%, #04377f 55%, #03285a 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(2,18,46,0.45)",
        }}
      >
        {/* brand */}
        <div
          style={{
            background: "linear-gradient(160deg,#04377f,#022a5f)",
            padding: "46px 40px",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 520,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "#f9b801",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#04377f",
                fontSize: 18,
              }}
            >
              365
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Parceiro <span style={{ color: "#f9b801" }}>365</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              O portal do
              <br />
              parceiro Bateria365.
            </div>
            <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "#bcd0ec", maxWidth: 300 }}>
              Cadastre alunos, emita certificados, gere convites e realize sorteios — tudo em um só lugar.
            </p>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {["Certificados", "Convites", "Sorteios"].map((t) => (
              <div key={t} style={{ fontSize: 12.5, color: "#9fbbe0" }}>
                <span style={{ color: "#f9b801" }}>●</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* form */}
        <div
          style={{
            background: "#fff",
            padding: "46px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#1f2733" }}>
            Acessar painel
          </h1>
          <p style={{ margin: "0 0 26px", fontSize: 13.5, color: "#6a7585" }}>Entre com a conta do seu distribuidor.</p>

          <form action={action}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 6 }}>
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="voce@distribuidor.com"
              className="pf365"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                fontSize: 14,
                border: "1.5px solid #dde3ec",
                borderRadius: 11,
                marginBottom: 16,
                color: "#1f2733",
              }}
            />
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 6 }}>
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pf365"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                fontSize: 14,
                border: "1.5px solid #dde3ec",
                borderRadius: 11,
                color: "#1f2733",
              }}
            />

            {state?.error && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>⚠ {state.error}</div>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                height: 48,
                marginTop: 22,
                background: "#04377f",
                color: "#fff",
                border: "none",
                borderRadius: 11,
                fontSize: 15,
                fontWeight: 700,
                cursor: pending ? "wait" : "pointer",
                opacity: pending ? 0.75 : 1,
                boxShadow: "0 6px 18px rgba(4,55,122,0.28)",
              }}
            >
              {pending ? "Entrando…" : "Entrar no painel"}
            </button>
          </form>
        </div>
      </div>

      <style>{`.pf365:focus { outline:none; border-color:#04377f !important; box-shadow:0 0 0 3px rgba(4,55,122,0.10); }`}</style>
    </div>
  )
}
