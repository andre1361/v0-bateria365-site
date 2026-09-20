"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { Loader2, Radio, Search, CheckCircle2, XCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ResultadoConsulta, Tentativa } from "@/lib/radio-code/consulta"

// Só Renault por enquanto; a lista existe para facilitar novas montadoras.
const MONTADORAS = [{ id: "renault", nome: "Renault" }] as const

// Máscara SSS-9A99 (padrão Mercosul), mas aceita a antiga e texto sem hífen:
// só filtra caracteres, coloca em maiúsculas e insere o hífen após o 3º.
function aplicarMascara(v: string) {
  const limpo = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7)
  return limpo.length > 3 ? `${limpo.slice(0, 3)}-${limpo.slice(3)}` : limpo
}

export function ConsultaClient() {
  const [montadora, setMontadora] = useState<(typeof MONTADORAS)[number]["id"]>("renault")
  const [placa, setPlaca] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null)
  const [erroRede, setErroRede] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const placaCompleta = placa.replace("-", "").length === 7

  async function consultar(e: FormEvent) {
    e.preventDefault()
    if (!placaCompleta || carregando) return
    setCarregando(true)
    setResultado(null)
    setErroRede(null)
    setCopiado(false)
    try {
      const res = await fetch("/api/codigo-radio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, montadora }),
      })
      const dados = (await res.json()) as ResultadoConsulta
      setResultado(dados)
    } catch {
      setErroRede("Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.")
    } finally {
      setCarregando(false)
    }
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // clipboard indisponível (http, permissão): sem feedback, o código continua visível
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-10 font-sans text-[#16202f] sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={40} className="mx-auto mb-5 h-9 w-auto" priority />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
            <Radio className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[27px]">Código do rádio</h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-[#5a6579]">
            Informe a placa do veículo para recuperar o código de desbloqueio do rádio.
          </p>
        </header>

        <form onSubmit={consultar} className="rounded-2xl border border-[#e3e8f0] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(16,33,60,.45)] sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="montadora" className="text-[13px] font-bold text-[#41506a]">Montadora</Label>
            <div id="montadora" role="radiogroup" className="flex flex-wrap gap-2">
              {MONTADORAS.map((m) => {
                const on = m.id === montadora
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMontadora(m.id)}
                    className={`h-9 rounded-full px-4 text-[13.5px] font-bold transition-colors ${on ? "bg-primary text-white" : "border border-[#d9e0ea] bg-white text-[#41506a] hover:bg-[#f1f4f9]"}`}
                  >
                    {m.nome}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="placa" className="text-[13px] font-bold text-[#41506a]">Placa do veículo</Label>
            <Input
              id="placa"
              name="placa"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="AAA-0A00"
              value={placa}
              onChange={(e) => setPlaca(aplicarMascara(e.target.value))}
              maxLength={8}
              className="h-14 rounded-xl border-[#d9e0ea] text-center font-mono text-2xl font-bold uppercase tracking-[0.18em] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            />
            <p className="text-xs text-[#7b8597]">Aceita placa Mercosul (AAA-0A00) ou antiga (AAA-0000), com ou sem hífen.</p>
          </div>

          <Button type="submit" size="lg" disabled={!placaCompleta || carregando} className="mt-5 h-12 w-full rounded-xl text-[15px] font-bold">
            {carregando ? (
              <>
                <Loader2 className="animate-spin" /> Consultando…
              </>
            ) : (
              <>
                <Search /> Consultar código
              </>
            )}
          </Button>
        </form>

        {carregando && (
          <p className="mt-4 text-center text-[13px] text-[#7b8597]">O serviço da Renault pode levar até 1 minuto para responder.</p>
        )}

        {erroRede && <Aviso titulo="Falha de conexão" texto={erroRede} />}

        {resultado && resultado.ok && (
          <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center sm:p-6" aria-live="polite">
            <div className="mb-2 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Código encontrado
            </div>
            <div className="font-mono text-5xl font-extrabold tracking-[0.2em] text-[#16202f]">{resultado.codigo}</div>
            <p className="mt-3 text-[13.5px] text-[#41506a]">
              Placa consultada <strong>{resultado.placa_consultada}</strong> ({resultado.formato})
              {resultado.fallback && <> — encontrada no formato {resultado.formato.toLowerCase()} da placa informada.</>}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => copiar(resultado.codigo)} className="mt-4 rounded-full bg-white">
              {copiado ? (<><Check /> Copiado</>) : (<><Copy /> Copiar código</>)}
            </Button>
          </section>
        )}

        {resultado && !resultado.ok && <Aviso titulo="Código não encontrado" texto={resultado.erro} />}

        {resultado && resultado.tentativas.length > 0 && <PainelTentativas tentativas={resultado.tentativas} />}

        <footer className="mt-8 text-center text-[12px] leading-relaxed text-[#8a94a6]">
          Consulta feita no serviço oficial da Renault. Em caso de dúvida, o SAC Renault atende no 0800 055 56 15.
          <br />
          Use apenas com placas de veículos sob sua responsabilidade.
        </footer>
      </div>
    </main>
  )
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5" aria-live="polite">
      <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-red-700">
        <XCircle className="h-4 w-4" /> {titulo}
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">{texto}</p>
    </section>
  )
}

function PainelTentativas({ tentativas }: { tentativas: Tentativa[] }) {
  return (
    <section className="mt-4 rounded-2xl border border-[#e3e8f0] bg-white p-4">
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#7b8597]">Placas consultadas</h2>
      <ul className="divide-y divide-[#eef1f6]">
        {tentativas.map((t, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            {t.achou ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#b0b8c6]" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
                <span className="font-mono font-bold tracking-wider">{t.placa}</span>
                <span className="text-[12px] text-[#7b8597]">{t.formato} · HTTP {t.status || "—"}</span>
              </div>
              <p className="mt-0.5 break-words text-[12.5px] leading-snug text-[#5a6579]">{t.mensagem}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
