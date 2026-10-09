"use client"

export function BotaoImprimir() {
  return (
    <button
      type="button"
      className="nao-imprimir"
      onClick={() => window.print()}
      style={{ height: 44, padding: "0 18px", background: "#fff", color: "#04377f", border: "1.5px solid #c9d6ea", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
    >
      Imprimir / salvar PDF
    </button>
  )
}
