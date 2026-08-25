import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "../sidebar"
import { logoutAction } from "../actions"
import { requireUser } from "../guard"
import { stopImpersonating } from "./admin/actions"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/parceiro365/login")
  const u = await requireUser()

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <Sidebar role={u.role} nome={u.nome || "Distribuidor"} cidade={u.cidade || ""} logoutAction={logoutAction} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {u.impersonating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              padding: "10px 20px",
              background: "#fff7ed",
              borderBottom: "1px solid #f4d9ae",
              color: "#9a6700",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>
              👁 Você está acessando a conta de <strong>{u.nome}</strong>
              {u.realAdminName ? ` (admin: ${u.realAdminName})` : ""}. Tudo o que você vê e altera é na conta deste distribuidor.
            </span>
            <form action={stopImpersonating} style={{ marginLeft: "auto" }}>
              <button
                type="submit"
                style={{ height: 32, padding: "0 14px", background: "#04377f", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Sair da conta
              </button>
            </form>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
