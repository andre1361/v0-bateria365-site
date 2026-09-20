"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { Loader2, Search, CheckCircle2, XCircle, Copy, Check, Phone, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { maskPhone } from "@/lib/phone"
import type { ResultadoConsulta } from "@/lib/radio-code/consulta"

// Só Renault por enquanto; a lista existe para facilitar novas montadoras.
const MONTADORAS = [{ id: "renault", nome: "Renault" }] as const

const SAC_RENAULT = { exibicao: "0800 055 56 15", tel: "tel:08000555615" }

// Máscara SSS-9A99 (padrão Mercosul), mas aceita a antiga e texto sem hífen:
// só filtra caracteres, coloca em maiúsculas e insere o hífen após o 3º.
function aplicarMascara(v: string) {
  const limpo = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7)
  return limpo.length > 3 ? `${limpo.slice(0, 3)}-${limpo.slice(3)}` : limpo
}

// "AXU-9B03 e AXU-9103" para o texto amigável de placas consultadas.
function listarPlacas(placas: string[]) {
  if (placas.length <= 1) return placas[0] ?? ""
  return `${placas.slice(0, -1).join(", ")} e ${placas[placas.length - 1]}`
}

export function ConsultaClient() {
  const [montadora, setMontadora] = useState<(typeof MONTADORAS)[number]["id"]>("renault")
  const [placa, setPlaca] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null)
  const [erroRede, setErroRede] = useState<string | null>(null)

  const placaCompleta = placa.replace("-", "").length === 7

  async function consultar(e: FormEvent) {
    e.preventDefault()
    if (!placaCompleta || carregando) return
    setCarregando(true)
    setResultado(null)
    setErroRede(null)
    try {
      const res = await fetch("/api/codigo-radio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, montadora }),
      })
      setResultado((await res.json()) as ResultadoConsulta)
    } catch {
      setErroRede("Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.")
    } finally {
      setCarregando(false)
    }
  }

  const placasTentadas = resultado?.tentativas.map((t) => t.placa) ?? []

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-6 font-sans text-[#16202f] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={27} className="mx-auto mb-3 h-7 w-auto" priority />
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">Código do rádio</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">Digite a placa para recuperar o código de desbloqueio.</p>
        </header>

        <form onSubmit={consultar} className="rounded-2xl border border-[#e3e8f0] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(16,33,60,.45)] sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="montadora" className="text-[12.5px] font-bold text-[#41506a]">Montadora</Label>
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
                    className={`h-8 rounded-full px-4 text-[13px] font-bold transition-colors ${on ? "bg-primary text-white" : "border border-[#d9e0ea] bg-white text-[#41506a] hover:bg-[#f1f4f9]"}`}
                  >
                    {m.nome}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3.5 space-y-1.5">
            <Label htmlFor="placa" className="text-[12.5px] font-bold text-[#41506a]">Placa do veículo</Label>
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
              disabled={carregando}
              className="h-12 rounded-xl border-[#d9e0ea] text-center font-mono text-[22px] font-bold uppercase tracking-[0.18em] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            />
            <p className="text-[11.5px] text-[#7b8597]">Placa Mercosul ou antiga, com ou sem hífen.</p>
          </div>

          <Button type="submit" size="lg" disabled={!placaCompleta || carregando} className="mt-3.5 h-11 w-full rounded-xl text-[15px] font-bold">
            {carregando ? <><Loader2 className="animate-spin" /> Consultando…</> : <><Search /> Consultar código</>}
          </Button>
        </form>

        {carregando && (
          <section className="mt-3 rounded-2xl border border-[#e3e8f0] bg-white p-5 text-center" aria-live="polite">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-[15px] font-bold">Estamos consultando seu código…</p>
            <p className="mt-1 text-[13px] text-[#7b8597]">Isso pode levar até 1 minuto.</p>
          </section>
        )}

        {erroRede && <Aviso titulo="Falha de conexão" texto={erroRede} />}

        {resultado && resultado.ok && <Sucesso codigo={resultado.codigo} placa={resultado.placa_consultada} />}

        {resultado && !resultado.ok && (
          <Aviso
            titulo={resultado.tentativas.length ? "Código não encontrado" : "Não foi possível consultar"}
            texto={
              resultado.tentativas.length > 1
                ? `Consultamos as placas ${listarPlacas(placasTentadas)} e o código não está na base da Renault.`
                : resultado.erro
            }
            sac={resultado.tentativas.length > 0}
          />
        )}

        {!carregando && !(resultado && !resultado.ok) && (
          <p className="mt-3 rounded-xl bg-[#e4eaf3] px-4 py-3 text-center text-[12.5px] leading-relaxed text-[#41506a]">
            Nem sempre o código está na base da Renault. Se não aparecer, ligue para o SAC Renault:{" "}
            <a href={SAC_RENAULT.tel} className="whitespace-nowrap font-bold text-primary underline-offset-2 hover:underline">{SAC_RENAULT.exibicao}</a>.
          </p>
        )}

        <footer className="mt-5 text-center text-[11.5px] leading-relaxed text-[#8a94a6]">
          Consulta feita no serviço oficial da Renault. Use apenas com placas de veículos sob sua responsabilidade.
        </footer>
      </div>
    </main>
  )
}

function Sucesso({ codigo, placa }: { codigo: string; placa: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      // clipboard indisponível (http, permissão): sem feedback, o código continua visível
    }
  }

  return (
    <section className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" aria-live="polite">
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> Código encontrado
      </div>
      <div className="mt-1 font-mono text-5xl font-extrabold tracking-[0.2em]">{codigo}</div>
      <p className="mt-2 text-[13px] text-[#41506a]">Placa <strong>{placa}</strong></p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" onClick={copiar} className="rounded-xl bg-white">
          {copiado ? <><Check /> Copiado</> : <><Copy /> Copiar código</>}
        </Button>
        <EnviarWhatsApp codigo={codigo} placa={placa} />
      </div>
    </section>
  )
}

function EnviarWhatsApp({ codigo, placa }: { codigo: string; placa: string }) {
  const [aberto, setAberto] = useState(false)
  const [telefone, setTelefone] = useState("")
  const digitos = telefone.replace(/\D/g, "")
  const valido = digitos.length === 10 || digitos.length === 11

  const mensagem =
    `Olá! Segue o código do rádio do seu veículo (placa ${placa}):\n\n*${codigo}*\n\n` +
    `Digite esse código no rádio para desbloquear. Qualquer dúvida é só chamar!`

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    window.open(`https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener")
    setAberto(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button type="button" onClick={() => setAberto(true)} className="rounded-xl bg-[#25D366] text-white hover:bg-[#1fb857]">
        <MessageCircle /> Enviar no WhatsApp
      </Button>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Enviar código no WhatsApp</DialogTitle>
          <DialogDescription>Informe o número do cliente. A mensagem já vai pronta com o código.</DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="telefone" className="text-[12.5px] font-bold text-[#41506a]">WhatsApp do cliente</Label>
            <Input
              id="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              autoFocus
              className="h-12 rounded-xl text-lg"
            />
          </div>
          <div className="rounded-xl bg-[#f1f4f9] p-3 text-[12.5px] leading-relaxed text-[#41506a]">
            <div className="mb-1 flex items-center gap-1 font-bold text-[#7b8597]"><Phone className="h-3 w-3" /> Prévia da mensagem</div>
            <p className="whitespace-pre-line">{mensagem.replace(/\*/g, "")}</p>
          </div>
          <Button type="submit" disabled={!valido} className="h-11 w-full rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#1fb857]">
            <MessageCircle /> Abrir WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Aviso({ titulo, texto, sac }: { titulo: string; texto: string; sac?: boolean }) {
  return (
    <section className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-5" aria-live="polite">
      <div className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-red-700">
        <XCircle className="h-4 w-4" /> {titulo}
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">{texto}</p>
      {sac && (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-[#41506a]">
            Isso acontece com alguns veículos. Nesse caso, o código pode ser obtido pelo SAC da Renault.
          </p>
          <Button asChild variant="outline" className="mt-3 w-full rounded-xl bg-white">
            <a href={SAC_RENAULT.tel}><Phone /> Ligar para o SAC {SAC_RENAULT.exibicao}</a>
          </Button>
        </>
      )}
    </section>
  )
}
