import { PageHeader } from "../../page-header"
import { requireUser } from "../../guard"

export const metadata = { title: "Ajuda" }

// Vídeo hospedado no R2 (Cloudflare). Para trocar por um domínio próprio no
// futuro, basta atualizar esta URL.
const VIDEO_URL = "https://pub-c9a4b120084c4c3c8acc71e4d7ede2f8.r2.dev/parceiro-365.mp4"

const passos = [
  { n: "1", t: "Treinamentos", d: "Veja o treinamento que preparamos pra você — data, horário e local. É o ponto de partida de tudo." },
  { n: "2", t: "Empresas", d: 'Cadastre as empresas convidadas e quantos convidados cada uma traz. Em cada empresa, use "Copiar link" para ela cadastrar os próprios funcionários.' },
  { n: "3", t: "Alunos", d: "Acompanhe todos os alunos vinculados ao treinamento, organizados por empresa." },
  { n: "4", t: "Arte do convite", d: "Gere a imagem do convite (feed ou story) já preenchida com os dados do treinamento." },
  { n: "5", t: "Sorteios", d: "Sorteie brindes por nome (importando os alunos, podendo filtrar por empresa) ou por número/faixa." },
  { n: "6", t: "Certificados", d: "Emita os certificados dos participantes ao final do treinamento." },
]

export default async function AjudaPage() {
  await requireUser()

  return (
    <>
      <PageHeader title="Ajuda" subtitle="Como usar o Parceiro 365" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <div style={{ maxWidth: 860 }}>
          {/* Vídeo tutorial */}
          <div style={{ background: "#000", border: "1px solid #e6eaf1", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 30px -18px rgba(16,33,60,.5)" }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls preload="metadata" playsInline style={{ display: "block", width: "100%", height: "auto", maxHeight: "72vh", objectFit: "contain", background: "#000" }}>
              <source src={VIDEO_URL} type="video/mp4" />
              Seu navegador não consegue exibir o vídeo.{" "}
              <a href={VIDEO_URL} style={{ color: "#7fb0ff" }}>
                Baixe aqui
              </a>
              .
            </video>
          </div>
          <p style={{ margin: "12px 2px 0", fontSize: 13, color: "#8a94a3" }}>🎬 Vídeo com o passo a passo da plataforma. Dá pra assistir em tela cheia pelo próprio player.</p>

          {/* Passo a passo */}
          <h2 style={{ margin: "30px 0 14px", fontSize: 17, fontWeight: 800, color: "#1f2733" }}>Passo a passo rápido</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {passos.map((p) => (
              <div key={p.n} style={{ display: "flex", gap: 14, background: "#fff", border: "1px solid #e6eaf1", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "#04377f", color: "#fff", fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.n}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1f2733" }}>{p.t}</div>
                  <div style={{ fontSize: 13, color: "#5a6579", lineHeight: 1.5, marginTop: 2 }}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, background: "#eef4fc", border: "1px solid #d6e3f5", borderRadius: 14, padding: "14px 16px", fontSize: 13, color: "#204a86" }}>
            Ficou com dúvida em algo específico? Fale com o time da Bateria 365 que a gente te orienta. 💛
          </div>
        </div>
      </main>
    </>
  )
}
