import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "../sidebar"
import { logoutAction } from "../actions"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/parceiro365/login")
  const u = session.user

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <Sidebar
        role={u.role}
        nome={u.nome || u.name || "Distribuidor"}
        cidade={u.cidade || ""}
        logoutAction={logoutAction}
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  )
}
