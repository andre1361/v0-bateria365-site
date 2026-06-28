"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Users, Award, Mail, CalendarDays, Gift, Building2, type LucideIcon } from "lucide-react"

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean }

export function Sidebar({
  role,
  nome,
  cidade,
  logoutAction,
}: {
  role: "super_admin" | "distribuidor"
  nome: string
  cidade: string
  logoutAction: () => void | Promise<void>
}) {
  const pathname = usePathname()

  const items: Item[] = [
    { href: "/parceiro365", label: "Visão geral", icon: LayoutGrid, exact: true },
    { href: "/parceiro365/alunos", label: "Alunos", icon: Users },
    { href: "/parceiro365/certificados", label: "Certificados", icon: Award },
    { href: "/parceiro365/convites", label: "Convites", icon: Mail },
    { href: "/parceiro365/eventos", label: "Eventos", icon: CalendarDays },
    { href: "/parceiro365/sorteios", label: "Sorteios", icon: Gift },
  ]
  if (role === "super_admin") {
    items.unshift({ href: "/parceiro365/admin", label: "Distribuidores", icon: Building2 })
  }

  const isActive = (it: Item) => (it.exact ? pathname === it.href : pathname.startsWith(it.href))

  return (
    <aside
      style={{
        width: 248,
        flex: "none",
        background: "#04377f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "22px 22px 18px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#f9b801",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#04377f",
            fontSize: 14,
          }}
        >
          365
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Parceiro <span style={{ color: "#f9b801" }}>365</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((it) => {
          const on = isActive(it)
          const Icon = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
                transition: "background .14s",
                background: on ? "rgba(255,255,255,0.14)" : "transparent",
                color: on ? "#fff" : "#bcd0ec",
              }}
            >
              <Icon size={18} style={{ flex: "none" }} />
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.10)" }}>
        <div
          style={{
            fontSize: 11,
            color: "#9fbbe0",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 3,
          }}
        >
          {role === "super_admin" ? "Super admin" : "Distribuidor"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{nome}</div>
        {cidade && <div style={{ fontSize: 12, color: "#bcd0ec", marginTop: 1 }}>{cidade}</div>}
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              marginTop: 12,
              width: "100%",
              height: 36,
              background: "rgba(255,255,255,0.08)",
              color: "#dfe9f6",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
