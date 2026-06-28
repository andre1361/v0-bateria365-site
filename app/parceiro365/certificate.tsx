/* eslint-disable @next/next/no-img-element */
import type React from "react"

// Template do Certificado (porte de Certificado.dc.html). Usa container-queries
// (unidades cqw) para escalar com a largura — funciona na prévia e na impressão.
export function Certificate({
  nome,
  empresa,
  distribuidor,
  cidade,
  extenso,
  style,
}: {
  nome: string
  empresa?: string
  distribuidor?: string
  cidade?: string
  extenso?: string
  style?: React.CSSProperties
}) {
  const nomeDisplay = (nome || "").trim() || "Nome do Aluno"
  const empresaT = (empresa || "").trim()
  const distribuidorT = (distribuidor || "").trim()
  const corpoTexto =
    "Concluiu com sucesso e dedicação o treinamento Bateria365" +
    (empresaT ? ", representando a empresa " + empresaT : "") +
    (distribuidorT ? ", oferecido pelo " + distribuidorT : "")
  const cidadeData = [(cidade || "").trim(), (extenso || "").trim()].filter(Boolean).join(", ")

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1123 / 794",
        background: "#04377f",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-pt-sans), sans-serif",
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: "24.5%", height: "95.7%", background: "#d9d9d9" }} />
      <div
        style={{
          position: "absolute",
          left: "4.36%",
          top: "7.43%",
          right: "4.36%",
          bottom: "7.68%",
          background: "#ffffff",
          borderRadius: 13,
          containerType: "inline-size",
          overflow: "hidden",
        }}
      >
        <img
          src="/parceiro365/icon.png"
          alt=""
          style={{ position: "absolute", right: "-1cqw", bottom: "-1.5cqw", width: "40cqw", height: "auto", opacity: 0.09, pointerEvents: "none" }}
        />
        <div style={{ position: "absolute", left: "5.46cqw", top: "1.5cqw", width: "18.5cqw", height: "0.85cqw", background: "#f9b801", borderRadius: "1cqw" }} />
        <img src="/parceiro365/logo.png" alt="Bateria365" style={{ position: "absolute", left: "5.4cqw", top: "6.6cqw", width: "29cqw", height: "auto", display: "block" }} />
        <div style={{ position: "absolute", left: "5.3cqw", top: "15.6cqw", fontFamily: "var(--font-pt-serif), serif", fontWeight: 700, fontSize: "9cqw", lineHeight: 1, color: "#545454" }}>
          Certificado
        </div>
        <div style={{ position: "absolute", left: "6.9cqw", top: "27.2cqw", right: "6.9cqw" }}>
          <div style={{ fontFamily: "var(--font-pt-serif), serif", fontWeight: 700, fontSize: "3.7cqw", lineHeight: 1, color: "#545454", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nomeDisplay}
          </div>
          <div style={{ height: "0.32cqw", background: "#f9b801", width: "52.9cqw", maxWidth: "100%", marginTop: "1.5cqw" }} />
        </div>
        <div style={{ position: "absolute", left: "6.9cqw", top: "35cqw", width: "72cqw", fontSize: "2.04cqw", lineHeight: 1.5, color: "#545454" }}>{corpoTexto}</div>
        <div style={{ position: "absolute", left: "6.9cqw", top: "45.4cqw", fontSize: "2.04cqw", lineHeight: 1.4, color: "#545454", whiteSpace: "nowrap" }}>{cidadeData}</div>
        <div style={{ position: "absolute", left: "6.83cqw", top: "50.5cqw", width: "26.2cqw", textAlign: "center" }}>
          <img src="/parceiro365/sig-rafael.png" alt="" style={{ height: "8cqw", width: "auto", maxWidth: "95%", display: "inline-block", marginBottom: "-3cqw" }} />
          <div style={{ height: "0.24cqw", background: "#f9b801", width: "100%" }} />
          <div style={{ fontSize: "1.5cqw", fontWeight: 700, color: "#21325a", marginTop: "1cqw" }}>Rafael André</div>
          <div style={{ fontSize: "1.02cqw", letterSpacing: "0.16em", color: "#21325a", marginTop: "0.4cqw" }}>INSTRUTOR</div>
        </div>
        <div style={{ position: "absolute", left: "36.5cqw", top: "50.5cqw", width: "26.2cqw", textAlign: "center" }}>
          <img src="/parceiro365/sig-davi.png" alt="" style={{ height: "5cqw", width: "auto", maxWidth: "95%", display: "inline-block", marginBottom: "-1cqw" }} />
          <div style={{ height: "0.24cqw", background: "#f9b801", width: "100%" }} />
          <div style={{ fontSize: "1.5cqw", fontWeight: 700, color: "#21325a", marginTop: "1cqw" }}>Davi Barbosa</div>
          <div style={{ fontSize: "1.02cqw", letterSpacing: "0.16em", color: "#21325a", marginTop: "0.4cqw" }}>INSTRUTOR</div>
        </div>
      </div>
    </div>
  )
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// "2026-06-27" -> "27 de Junho de 2026"
export function dataExtenso(iso: string): string {
  if (!iso) return ""
  const p = iso.split("-")
  if (p.length !== 3) return ""
  const y = +p[0], m = +p[1], d = +p[2]
  if (!y || !m || !d) return ""
  return `${d} de ${MESES[m - 1]} de ${y}`
}
