export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #e6eaf1",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 14,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h1>
      {subtitle && <span style={{ fontSize: 13, color: "#9aa4b2" }}>{subtitle}</span>}
    </header>
  )
}
