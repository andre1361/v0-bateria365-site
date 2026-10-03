"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, MapPinOff, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Estado =
  | { etapa: "inicio" }
  | { etapa: "localizando" }
  | { etapa: "negado" }
  | { etapa: "bloqueado"; mensagem: string; uf: string | null }
  | { etapa: "erro"; mensagem: string }

type Props = {
  titulo: string
  subtitulo: string
  descricao: string // por que a localização é pedida
}

// Pede a localização do aparelho e libera a ferramenta se a UF estiver na lista do servidor.
// O cookie de região vale para todas as ferramentas (código do rádio, corrente de partida).
export function RegiaoGate({ titulo, subtitulo, descricao }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>({ etapa: "inicio" })

  function localizar() {
    if (!("geolocation" in navigator)) {
      setEstado({ etapa: "erro", mensagem: "Este navegador não informa a localização. Tente pelo celular, no Chrome ou no Safari." })
      return
    }
    setEstado({ etapa: "localizando" })
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch("/api/codigo-radio/regiao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude }),
          })
          const r = (await res.json()) as { liberado: boolean; uf: string | null; mensagem?: string }
          if (r.liberado) {
            router.refresh()
            return
          }
          setEstado(res.ok ? { etapa: "bloqueado", mensagem: r.mensagem ?? "", uf: r.uf } : { etapa: "erro", mensagem: r.mensagem ?? "Não foi possível verificar sua região." })
        } catch {
          setEstado({ etapa: "erro", mensagem: "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo." })
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setEstado({ etapa: "negado" })
        else setEstado({ etapa: "erro", mensagem: "Não conseguimos obter sua localização. Confira se o GPS está ligado e tente de novo." })
      },
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 10 * 60_000 },
    )
  }

  const localizando = estado.etapa === "localizando"

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-6 font-sans text-[#16202f] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={27} className="mx-auto mb-3 h-7 w-auto" priority />
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">{titulo}</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">{subtitulo}</p>
        </header>

        <section className="rounded-2xl border border-[#e3e8f0] bg-white p-5 text-center shadow-[0_10px_30px_-18px_rgba(16,33,60,.45)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e4eaf3] text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-[17px] font-extrabold">Confirme sua região</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5a6579]">{descricao}</p>
          <Button type="button" size="lg" onClick={localizar} disabled={localizando} className="mt-4 h-11 w-full rounded-xl text-[15px] font-bold">
            {localizando ? <><Loader2 className="animate-spin" /> Verificando sua região…</> : <><MapPin /> {estado.etapa === "inicio" ? "Permitir localização" : "Tentar de novo"}</>}
          </Button>
        </section>

        {estado.etapa === "bloqueado" && (
          <section className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-5" aria-live="polite">
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-red-700">
              <XCircle className="h-4 w-4" /> Acesso não disponível{estado.uf ? ` em ${estado.uf}` : ""}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">{estado.mensagem}</p>
          </section>
        )}

        {estado.etapa === "negado" && (
          <section className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-live="polite">
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-amber-700">
              <MapPinOff className="h-4 w-4" /> Localização bloqueada
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">
              Sem a localização não conseguimos liberar o acesso. Toque no cadeado ao lado do endereço do site, permita a localização e tente de novo.
            </p>
          </section>
        )}

        {estado.etapa === "erro" && (
          <section className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-5" aria-live="polite">
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-red-700">
              <XCircle className="h-4 w-4" /> Não foi possível verificar
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">{estado.mensagem}</p>
          </section>
        )}

        <footer className="mt-5 text-center text-[11.5px] leading-relaxed text-[#8a94a6]">
          Usamos a localização só para confirmar o estado. Ela não é armazenada.
        </footer>
      </div>
    </main>
  )
}
