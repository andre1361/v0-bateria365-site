"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { Loader2, Search, CheckCircle2, XCircle, Copy, Check, Phone, MessageCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { maskPhone } from "@/lib/phone"
import type { ResultadoConsulta } from "@/lib/radio-code/consulta"
import { calcularCodigoRenaultPrecode, mascararPrecode } from "@/lib/radio-code/renault-precode"
import { calcularCodigoFord, mascararSerieFord } from "@/lib/radio-code/ford"

const SAC_RENAULT = { exibicao: "0800 055 56 15", tel: "tel:08000555615" }

type Montadora = "renault" | "ford"
type Metodo = "placa" | "precode" | "ford-m"

type Modo = {
  id: Metodo
  montadora: Montadora
  nome: string // rótulo do seletor "Consultar por"
  rotuloCampo: string
  placeholder: string
  maxLength: number
  mascara: (v: string) => string
  completo: (v: string) => boolean
  dica: string // como obter o dado no carro
  nota: string // aviso permanente abaixo do formulário
  referencia: (v: string) => string // "placa AXU-9B03", "precode A123"...
}

// Máscara SSS-9A99 (padrão Mercosul), mas aceita a antiga e texto sem hífen.
function mascararPlaca(v: string) {
  const limpo = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7)
  return limpo.length > 3 ? `${limpo.slice(0, 3)}-${limpo.slice(3)}` : limpo
}

const MODOS: Modo[] = [
  {
    id: "placa",
    montadora: "renault",
    nome: "Placa",
    rotuloCampo: "Placa do veículo",
    placeholder: "AAA-0A00",
    maxLength: 8,
    mascara: mascararPlaca,
    completo: (v) => v.replace("-", "").length === 7,
    dica: "Placa Mercosul ou antiga, com ou sem hífen. A consulta é feita na base oficial da Renault.",
    nota: "Nem sempre o código está na base da Renault. Se não aparecer, tente pelo precode ou ligue para o SAC Renault: ",
    referencia: (v) => `placa ${v}`,
  },
  {
    id: "precode",
    montadora: "renault",
    nome: "Precode do rádio",
    rotuloCampo: "Precode do rádio",
    placeholder: "A123",
    maxLength: 4,
    mascara: mascararPrecode,
    completo: (v) => v.length === 4,
    dica: "Com o rádio ligado, segure as teclas 1 e 6 juntas por alguns segundos. O visor mostra o precode (1 letra e 3 números).",
    nota: "O código é calculado na hora, sem consultar a Renault. Precodes que começam com A0 não podem ser calculados.",
    referencia: (v) => `precode ${v}`,
  },
  {
    id: "ford-m",
    montadora: "ford",
    nome: "Série do rádio",
    rotuloCampo: "Série do rádio",
    placeholder: "M123456",
    maxLength: 7,
    mascara: mascararSerieFord,
    completo: (v) => /^[MV]?\d{6}$/.test(v), // V passa para mostrar o aviso
    dica: "Segure as teclas 1 e 6 juntas ao ligar o rádio. O visor mostra a série (M e 6 números). Se aparecer em duas telas, junte tudo.",
    nota: "Só rádios com série M. Rádios com série V não têm cálculo e dependem da concessionária Ford.",
    referencia: (v) => `série ${v}`,
  },
]

const MONTADORAS: { id: Montadora; nome: string }[] = [
  { id: "renault", nome: "Renault" },
  { id: "ford", nome: "Ford" },
]

type Resultado =
  | { ok: true; codigo: string; referencia: string; rotulo: string }
  | { ok: false; titulo: string; texto: string; sac?: boolean }

// "AXU-9B03 e AXU-9103" para o texto amigável de placas consultadas.
function listarPlacas(placas: string[]) {
  if (placas.length <= 1) return placas[0] ?? ""
  return `${placas.slice(0, -1).join(", ")} e ${placas[placas.length - 1]}`
}

function traduzirConsultaPlaca(r: ResultadoConsulta): Resultado {
  if (r.ok) return { ok: true, codigo: r.codigo, referencia: `placa ${r.placa_consultada}`, rotulo: `Placa ${r.placa_consultada}` }
  if (r.tentativas.length === 0) return { ok: false, titulo: "Não foi possível consultar", texto: r.erro }
  const texto =
    r.tentativas.length > 1
      ? `Consultamos as placas ${listarPlacas(r.tentativas.map((t) => t.placa))} e o código não está na base da Renault.`
      : r.erro
  return { ok: false, titulo: "Código não encontrado", texto, sac: true }
}

export function ConsultaClient() {
  const [modo, setModo] = useState<Modo>(MODOS[0])
  const [valor, setValor] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const modosDaMontadora = MODOS.filter((m) => m.montadora === modo.montadora)
  const completo = modo.completo(valor)

  function trocarModo(novo: Modo) {
    if (novo.id === modo.id) return
    setModo(novo)
    setValor("")
    setResultado(null)
  }

  function trocarMontadora(id: Montadora) {
    const primeiro = MODOS.find((m) => m.montadora === id)
    if (primeiro) trocarModo(primeiro)
  }

  async function consultar(e: FormEvent) {
    e.preventDefault()
    if (!completo || carregando) return
    setResultado(null)

    if (modo.id === "precode") {
      const r = calcularCodigoRenaultPrecode(valor)
      setResultado(r.ok ? { ok: true, codigo: r.codigo, referencia: `precode ${r.precode}`, rotulo: `Precode ${r.precode}` } : { ok: false, titulo: "Não foi possível calcular", texto: r.erro })
      return
    }
    if (modo.id === "ford-m") {
      const r = calcularCodigoFord(valor)
      setResultado(r.ok ? { ok: true, codigo: r.codigo, referencia: `série ${r.serie}`, rotulo: `Série ${r.serie}` } : { ok: false, titulo: "Não foi possível calcular", texto: r.erro })
      return
    }

    setCarregando(true)
    try {
      const res = await fetch("/api/codigo-radio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa: valor }),
      })
      setResultado(traduzirConsultaPlaca((await res.json()) as ResultadoConsulta))
    } catch {
      setResultado({ ok: false, titulo: "Falha de conexão", texto: "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo." })
    } finally {
      setCarregando(false)
    }
  }

  const chip = (on: boolean) =>
    `h-8 rounded-full px-4 text-[13px] font-bold transition-colors ${on ? "bg-primary text-white" : "border border-[#d9e0ea] bg-white text-[#41506a] hover:bg-[#f1f4f9]"}`

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-6 font-sans text-[#16202f] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={27} className="mx-auto mb-3 h-7 w-auto" priority />
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">Código do rádio</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">Recupere o código de desbloqueio do rádio.</p>
        </header>

        <form onSubmit={consultar} className="rounded-2xl border border-[#e3e8f0] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(16,33,60,.45)] sm:p-5">
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-bold text-[#41506a]">Montadora</Label>
            <div role="radiogroup" aria-label="Montadora" className="flex flex-wrap gap-2">
              {MONTADORAS.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={m.id === modo.montadora} onClick={() => trocarMontadora(m.id)} className={chip(m.id === modo.montadora)}>
                  {m.nome}
                </button>
              ))}
            </div>
          </div>

          {modosDaMontadora.length > 1 && (
            <div className="mt-3.5 space-y-1.5">
              <Label className="text-[12.5px] font-bold text-[#41506a]">Consultar por</Label>
              <div role="radiogroup" aria-label="Consultar por" className="flex flex-wrap gap-2">
                {modosDaMontadora.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={m.id === modo.id} onClick={() => trocarModo(m)} className={chip(m.id === modo.id)}>
                    {m.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3.5 space-y-1.5">
            <Label htmlFor="valor" className="text-[12.5px] font-bold text-[#41506a]">{modo.rotuloCampo}</Label>
            <Input
              key={modo.id}
              id="valor"
              name="valor"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={modo.placeholder}
              value={valor}
              onChange={(e) => setValor(modo.mascara(e.target.value))}
              maxLength={modo.maxLength}
              disabled={carregando}
              className="h-12 rounded-xl border-[#d9e0ea] text-center font-mono text-[22px] font-bold uppercase tracking-[0.18em] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            />
            <p className="text-[11.5px] leading-snug text-[#7b8597]">{modo.dica}</p>
          </div>

          <Button type="submit" size="lg" disabled={!completo || carregando} className="mt-3.5 h-11 w-full rounded-xl text-[15px] font-bold">
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

        {resultado?.ok && <Sucesso codigo={resultado.codigo} referencia={resultado.referencia} rotulo={resultado.rotulo} />}

        {resultado && !resultado.ok && <Aviso titulo={resultado.titulo} texto={resultado.texto} sac={resultado.sac} />}

        {!carregando && !(resultado && !resultado.ok) && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#e4eaf3] px-4 py-3 text-left text-[12.5px] leading-relaxed text-[#41506a]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7b8597]" />
            <span>
              {modo.nota}
              {modo.id === "placa" && (
                <a href={SAC_RENAULT.tel} className="whitespace-nowrap font-bold text-primary underline-offset-2 hover:underline">{SAC_RENAULT.exibicao}</a>
              )}
            </span>
          </p>
        )}

        <footer className="mt-5 text-center text-[11.5px] leading-relaxed text-[#8a94a6]">
          Use apenas com veículos sob sua responsabilidade.
        </footer>
      </div>
    </main>
  )
}

function Sucesso({ codigo, referencia, rotulo }: { codigo: string; referencia: string; rotulo: string }) {
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
      <p className="mt-2 text-[13px] text-[#41506a]">{rotulo}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" onClick={copiar} className="rounded-xl bg-white">
          {copiado ? <><Check /> Copiado</> : <><Copy /> Copiar código</>}
        </Button>
        <EnviarWhatsApp codigo={codigo} referencia={referencia} />
      </div>
    </section>
  )
}

function EnviarWhatsApp({ codigo, referencia }: { codigo: string; referencia: string }) {
  const [aberto, setAberto] = useState(false)
  const [telefone, setTelefone] = useState("")
  const digitos = telefone.replace(/\D/g, "")
  const valido = digitos.length === 10 || digitos.length === 11

  const mensagem =
    `Olá! Segue o código do rádio do seu veículo (${referencia}):\n\n*${codigo}*\n\n` +
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
            Isso acontece com alguns veículos. Você pode tentar pelo precode do rádio ou obter o código pelo SAC da Renault.
          </p>
          <Button asChild variant="outline" className="mt-3 w-full rounded-xl bg-white">
            <a href={SAC_RENAULT.tel}><Phone /> Ligar para o SAC {SAC_RENAULT.exibicao}</a>
          </Button>
        </>
      )}
    </section>
  )
}
