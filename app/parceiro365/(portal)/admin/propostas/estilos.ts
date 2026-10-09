import type React from "react"

// Estilos compartilhados das telas de propostas (mesmo visual do restante do portal).
export const field: React.CSSProperties = {
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
export const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#41506a", marginBottom: 6 }
export const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6eaf1", borderRadius: 16, padding: 22 }
export const tituloSecao: React.CSSProperties = { margin: "0 0 14px", fontSize: 15, fontWeight: 800 }
export const botaoPrimario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 44,
  padding: "0 18px",
  background: "#04377f",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
}
export const botaoSecundario: React.CSSProperties = {
  ...botaoPrimario,
  background: "#fff",
  color: "#04377f",
  border: "1.5px solid #c9d6ea",
}
