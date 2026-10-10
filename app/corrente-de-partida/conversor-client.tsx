"use client"

import { useId, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NORMAS, NORMA_PADRAO, arredondar5, converterTodas, norma as buscarNorma, validarValor, type NormaId } from "@/lib/corrente-partida/normas"
import { decodificarJis, type JisDecodificado } from "@/lib/corrente-partida/jis"
import { calcularParecer, climaPorUf, type Clima, type Nivel, type Parecer, type Veiculo } from "@/lib/corrente-partida/parecer"

type Aba = "converter" | "comparar"
// valorDoCodigo: o valor do campo veio da CCA de referência do código JIS, não da etiqueta.
type Bateria = { norma: NormaId; texto: string; codigoJis: string; valorDoCodigo: boolean }

const BATERIA_VAZIA: Bateria = { norma: NORMA_PADRAO, texto: "", codigoJis: "", valorDoCodigo: false }

const ABAS: { id: Aba; nome: string }[] = [
  { id: "converter", nome: "Converter" },
  { id: "comparar", nome: "Comparar" },
]

const VEICULOS: { id: Veiculo; nome: string }[] = [
  { id: "flex", nome: "Flex / gasolina" },
  { id: "diesel", nome: "Diesel" },
  { id: "start-stop", nome: "Start-stop" },
]

const CLIMAS: { id: Clima; nome: string }[] = [
  { id: "tropical", nome: "Clima quente" },
  { id: "frio", nome: "Sul / serra (frio)" },
]

const ESTILO_NIVEL: Record<Nivel, { caixa: string; titulo: string; Icone: typeof CheckCircle2 }> = {
  compativel: { caixa: "border-emerald-200 bg-emerald-50", titulo: "text-emerald-700", Icone: CheckCircle2 },
  aceitavel: { caixa: "border-emerald-200 bg-emerald-50", titulo: "text-emerald-700", Icone: CheckCircle2 },
  ressalva: { caixa: "border-amber-200 bg-amber-50", titulo: "text-amber-700", Icone: AlertTriangle },
  "nao-recomendado": { caixa: "border-red-200 bg-red-50", titulo: "text-red-700", Icone: XCircle },
}

const CARD = "rounded-2xl border border-[#e3e8f0] bg-white p-4 shadow-[0_10px_30px_-18px_rgba(16,33,60,.45)] sm:p-5"
const ROTULO = "text-[12.5px] font-bold text-[#41506a]"

// Alvo de toque de 44 px (uso no celular do balcão) e foco visível para quem navega pelo teclado.
const FOCO = "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

const chip = (on: boolean) =>
  `h-11 rounded-full px-4 text-[13.5px] font-bold transition-colors ${FOCO} ${on ? "bg-primary text-white" : "border border-[#d9e0ea] bg-white text-[#41506a] hover:bg-[#f1f4f9]"}`

const SETAS: Record<string, (i: number, total: number) => number> = {
  ArrowRight: (i) => i + 1,
  ArrowDown: (i) => i + 1,
  ArrowLeft: (i) => i - 1,
  ArrowUp: (i) => i - 1,
  Home: () => 0,
  End: (_, total) => total - 1,
}

// Setas, Home e End trocam a opção escolhida e levam o foco junto, como nos grupos de rádio e abas nativos.
function navegarComSetas<T extends string>(e: KeyboardEvent, ids: T[], atual: T, prefixo: string, escolher: (id: T) => void) {
  const mover = SETAS[e.key]
  if (!mover) return
  e.preventDefault()
  const proximo = ids[(mover(ids.indexOf(atual), ids.length) + ids.length) % ids.length]
  escolher(proximo)
  document.getElementById(`${prefixo}-${proximo}`)?.focus()
}

export function ConversorClient({ uf }: { uf: string }) {
  const [aba, setAba] = useState<Aba>("converter")
  const base = useId()

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-6 font-sans text-[#16202f] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={27} className="mx-auto mb-3 h-7 w-auto" priority />
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">Corrente de partida</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">Converta entre normas e confira se a bateria serve.</p>
        </header>

        <div
          role="tablist"
          aria-label="Ferramenta"
          onKeyDown={(e) => navegarComSetas(e, ABAS.map((a) => a.id), aba, `${base}-aba`, setAba)}
          className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-[#e4eaf3] p-1"
        >
          {ABAS.map((a) => (
            <button
              key={a.id}
              id={`${base}-aba-${a.id}`}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              aria-controls={`${base}-painel-${a.id}`}
              tabIndex={aba === a.id ? 0 : -1}
              onClick={() => setAba(a.id)}
              className={`h-11 rounded-lg text-[14px] font-bold transition-colors ${FOCO} ${aba === a.id ? "bg-white text-primary shadow-sm" : "text-[#5a6579]"}`}
            >
              {a.nome}
            </button>
          ))}
        </div>

        {/* As duas abas ficam montadas para não perder o que foi digitado ao trocar. */}
        <div role="tabpanel" id={`${base}-painel-converter`} aria-labelledby={`${base}-aba-converter`} hidden={aba !== "converter"}>
          <Converter />
        </div>
        <div role="tabpanel" id={`${base}-painel-comparar`} aria-labelledby={`${base}-aba-comparar`} hidden={aba !== "comparar"}>
          <Comparar uf={uf} />
        </div>

        <ComoCalculamos />

        <footer className="mt-5 text-center text-[11.5px] leading-relaxed text-[#8a94a6]">
          Valores de referência. Na dúvida, vale a especificação da montadora.
        </footer>
      </div>
    </main>
  )
}

function Converter() {
  const [bateria, setBateria] = useState<Bateria>(BATERIA_VAZIA)
  const v = validarValor(bateria.texto)

  return (
    <>
      <section className={CARD}>
        <CampoBateria id="conv" bateria={bateria} onChange={setBateria} />
      </section>

      {v.ok && (
        <section className={`mt-3 ${CARD}`} aria-live="polite">
          <h2 className="text-[12.5px] font-bold uppercase tracking-wide text-[#7b8597]">Equivalente em cada norma</h2>
          <ul className="mt-2 divide-y divide-[#eef2f8]">
            {converterTodas(v.valor, bateria.norma).map(({ norma, faixa }) => {
              const entrada = norma.id === bateria.norma
              const min = arredondar5(faixa.min)
              const max = arredondar5(faixa.max)
              return (
                <li key={norma.id} className={`flex items-center justify-between gap-3 py-2.5 ${entrada ? "-mx-2 rounded-lg bg-[#e4eaf3] px-2" : ""}`}>
                  <div>
                    <div className="text-[14px] font-bold">{norma.sigla}</div>
                    <div className="text-[11.5px] text-[#7b8597]">{norma.rotulo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-extrabold tabular-nums">
                      {entrada || min === max ? "" : "≈ "}
                      {arredondar5(faixa.centro)} A
                    </div>
                    {min !== max && <div className="text-[11.5px] tabular-nums text-[#7b8597]">faixa {min}–{max} A</div>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}

function Comparar({ uf }: { uf: string }) {
  const climaDaUf = climaPorUf(uf)
  const [original, setOriginal] = useState<Bateria>(BATERIA_VAZIA)
  const [candidata, setCandidata] = useState<Bateria>(BATERIA_VAZIA)
  const [veiculo, setVeiculo] = useState<Veiculo>("flex")
  const [clima, setClima] = useState<Clima>(climaDaUf)

  const vo = validarValor(original.texto)
  const vc = validarValor(candidata.texto)
  const parecer =
    vo.ok && vc.ok
      ? calcularParecer({ original: { valor: vo.valor, norma: original.norma }, candidata: { valor: vc.valor, norma: candidata.norma }, veiculo, clima })
      : null

  return (
    <>
      <section className={CARD}>
        <CampoBateria id="orig" titulo="Bateria original do veículo" bateria={original} onChange={setOriginal} />
      </section>
      <section className={`mt-3 ${CARD}`}>
        <CampoBateria id="cand" titulo="Bateria que você tem" bateria={candidata} onChange={setCandidata} />
      </section>

      <section className={`mt-3 space-y-3.5 ${CARD}`}>
        <GrupoOpcoes rotulo="Tipo de veículo" opcoes={VEICULOS} valor={veiculo} onChange={setVeiculo} />
        <div className="space-y-1.5">
          <GrupoOpcoes rotulo="Clima onde o carro roda" opcoes={CLIMAS} valor={clima} onChange={setClima} />
          <p className="flex items-center gap-1 text-[11.5px] leading-snug text-[#7b8597]">
            <MapPin className="h-3 w-3 shrink-0" /> Você está em {uf}: sugerimos {climaDaUf === "frio" ? "Sul / serra (frio)." : "clima quente. Troque se o carro roda em serra."}
          </p>
        </div>
      </section>

      {parecer ? (
        <ParecerCard parecer={parecer} />
      ) : (
        <p className="mt-3 rounded-xl bg-[#e4eaf3] px-4 py-3 text-center text-[12.5px] text-[#41506a]">Preencha as duas baterias para ver o parecer.</p>
      )}
    </>
  )
}

// Grupo de botões que funciona como rádio: só a opção marcada entra no Tab; as setas trocam a escolha.
// contexto: id de um título que diferencia grupos com o mesmo rótulo (ex.: "Norma da etiqueta" da original e da candidata).
function GrupoOpcoes<T extends string>({
  rotulo,
  contexto,
  opcoes,
  valor,
  onChange,
}: {
  rotulo: string
  contexto?: string
  opcoes: { id: T; nome: string }[]
  valor: T
  onChange: (id: T) => void
}) {
  const base = useId()
  return (
    <div className="space-y-1.5">
      <span id={`${base}-rotulo`} className={`block ${ROTULO}`}>{rotulo}</span>
      <div
        role="radiogroup"
        aria-labelledby={contexto ? `${contexto} ${base}-rotulo` : `${base}-rotulo`}
        onKeyDown={(e) => navegarComSetas(e, opcoes.map((o) => o.id), valor, base, onChange)}
        className="flex flex-wrap gap-2"
      >
        {opcoes.map((o) => (
          <button
            key={o.id}
            id={`${base}-${o.id}`}
            type="button"
            role="radio"
            aria-checked={o.id === valor}
            tabIndex={o.id === valor ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={chip(o.id === valor)}
          >
            {o.nome}
          </button>
        ))}
      </div>
    </div>
  )
}

function CampoBateria({ id, titulo, bateria, onChange }: { id: string; titulo?: string; bateria: Bateria; onChange: (b: Bateria) => void }) {
  const normaAtual = buscarNorma(bateria.norma)
  const validacao = validarValor(bateria.texto)
  const temCodigo = bateria.norma === "jis" && bateria.codigoJis.trim() !== ""
  const jis = temCodigo ? decodificarJis(bateria.codigoJis) : null

  // Código JIS conhecido preenche a CCA de referência; o lojista pode corrigir com o valor da etiqueta.
  function trocarCodigo(codigoJis: string) {
    const d = decodificarJis(codigoJis)
    if (d?.cca && (bateria.texto.trim() === "" || bateria.valorDoCodigo)) {
      onChange({ ...bateria, codigoJis, texto: String(d.cca), valorDoCodigo: true })
    } else if (bateria.valorDoCodigo) {
      // O valor atual veio de um código anterior: não vale para este.
      onChange({ ...bateria, codigoJis, texto: "", valorDoCodigo: false })
    } else {
      onChange({ ...bateria, codigoJis })
    }
  }

  // A CCA de referência só vale para JIS: ao sair dela, descarta o valor que veio do código.
  function trocarNorma(norma: NormaId) {
    if (norma !== "jis" && bateria.valorDoCodigo) onChange({ ...bateria, norma, texto: "", valorDoCodigo: false })
    else onChange({ ...bateria, norma })
  }

  return (
    <div className="space-y-3.5">
      {titulo && <h2 id={`${id}-titulo`} className="text-[15px] font-extrabold">{titulo}</h2>}

      <div className="space-y-1.5">
        <GrupoOpcoes
          rotulo="Norma da etiqueta"
          contexto={titulo ? `${id}-titulo` : undefined}
          opcoes={NORMAS.map((n) => ({ id: n.id, nome: n.sigla }))}
          valor={bateria.norma}
          onChange={trocarNorma}
        />
        {normaAtual.nota && <p className="text-[11.5px] leading-snug text-[#7b8597]">{normaAtual.nota}</p>}
      </div>

      {bateria.norma === "jis" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-jis`} className={ROTULO}>Código JIS (opcional)</Label>
          <Input
            id={`${id}-jis`}
            placeholder="55B24L"
            value={bateria.codigoJis}
            onChange={(e) => trocarCodigo(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            className="h-11 rounded-xl border-[#d9e0ea] font-mono text-[17px] font-bold uppercase tracking-wider"
          />
          {temCodigo && !jis && <p className="text-[12px] font-semibold text-red-600">Código JIS não reconhecido. Ex.: 55B24L.</p>}
          {jis && <JisInfo jis={jis} />}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-valor`} className={ROTULO}>Corrente de partida ({normaAtual.sigla})</Label>
        <div className="relative">
          <Input
            id={`${id}-valor`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex.: 500"
            value={bateria.texto}
            onChange={(e) => onChange({ ...bateria, texto: e.target.value, valorDoCodigo: false })}
            maxLength={7}
            className="h-12 rounded-xl border-[#d9e0ea] pr-10 text-center text-[22px] font-bold"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#7b8597]">A</span>
        </div>
        {!validacao.ok && validacao.erro && <p className="text-[12px] font-semibold text-red-600">{validacao.erro}</p>}
      </div>
    </div>
  )
}

function JisInfo({ jis }: { jis: JisDecodificado }) {
  return (
    <div className="rounded-xl bg-[#f1f4f9] p-3 text-[12.5px] leading-relaxed text-[#41506a]">
      <p><b>{jis.classe}</b>: classe de desempenho (não é ampère)</p>
      <p><b>{jis.caixa}</b>: tamanho da caixa{jis.larguraMm ? ` (largura ≈ ${jis.larguraMm} mm)` : ""}</p>
      <p><b>{jis.comprimentoCm}</b>: comprimento ≈ {jis.comprimentoCm} cm</p>
      {jis.polo && <p><b>{jis.polo}</b>: polo negativo do lado {jis.polo === "L" ? "esquerdo" : "direito"}</p>}
      <p className="mt-1.5 font-semibold">
        {jis.cca ? `CCA de referência: ${jis.cca} A. Se a etiqueta trouxer a CCA, use o valor da etiqueta.` : "Código sem CCA de referência. Informe o valor da etiqueta."}
      </p>
    </div>
  )
}

function ParecerCard({ parecer }: { parecer: Parecer }) {
  const { caixa, titulo, Icone } = ESTILO_NIVEL[parecer.nivel]
  return (
    <section className={`mt-3 rounded-2xl border p-5 ${caixa}`} aria-live="polite">
      <div className={`flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide ${titulo}`}>
        <Icone className="h-4 w-4" /> {parecer.titulo}
      </div>
      <div className="mt-1 text-4xl font-extrabold tabular-nums">{parecer.porcentagem}%</div>
      <p className="text-[12.5px] text-[#41506a]">
        da corrente da original · {Math.floor(parecer.saeCandidata)} A contra {Math.ceil(parecer.saeOriginal)} A (em SAE)
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-[#41506a]">{parecer.explicacao}</p>
      {parecer.motivos.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-[#41506a]">
          {parecer.motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ComoCalculamos() {
  return (
    <details className="mt-3 rounded-xl bg-[#e4eaf3] px-4 py-3 text-[12.5px] leading-relaxed text-[#41506a]">
      <summary className="cursor-pointer font-bold">Como calculamos</summary>
      <div className="mt-2 space-y-2">
        <p>Tudo é convertido para SAE (CCA a −18 °C). NBR e JIS usam o mesmo ensaio da SAE. Para EN, IEC, DIN e CA/MCA não existe fator oficial: mostramos a faixa das tabelas de mercado. Com normas diferentes, comparamos o pior caso da conversão.</p>
        <p>
          A 0 °C a bateria entrega cerca de 25% mais corrente que a −18 °C, e o motor pede menos para girar. Por isso, em clima quente, aceitamos até 10% abaixo da original e, com ressalva, até 20%. Diesel, start-stop e regiões frias (Sul e serras) pedem corrente igual ou maior que a original, como recomenda a Moura.
        </p>
        <p>Não convertemos EN antiga (anterior a 2006) nem JIS de 1999: elas não geram uma CCA comparável.</p>
      </div>
    </details>
  )
}
