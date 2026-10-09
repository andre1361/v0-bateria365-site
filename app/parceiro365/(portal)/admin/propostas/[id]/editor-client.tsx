"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { aeroportoPorIata, sugerirAeroporto } from "@/lib/proposta/aeroportos"
import { calcularProposta, datasViagem, type Parametros, type VooEscolhido, type Voos } from "@/lib/proposta/calculo"
import { formatarPercentual, formatarValorCampo, parseBRL, parsePercentual } from "@/lib/proposta/formato"
import { ORIGENS, type OrigemId } from "@/lib/proposta/origens"
import type { ResultadoBusca } from "@/lib/proposta/serpapi"
import { ROTULO_STATUS, podeEditar, type StatusEfetivo } from "@/lib/proposta/status"
import { buscarVoos, cancelarProposta, gerarLink, salvarProposta } from "../actions"
import { botaoPrimario, botaoSecundario, card, field, label, tituloSecao } from "../estilos"
import { CampoAeroporto } from "./campo-aeroporto"
import { ColunaVoos } from "./coluna-voos"
import { LinkGerado } from "./link-gerado"
import { Resumo } from "./resumo"

export type Distribuidor = { id: string; nome: string; cidade: string }
export type PropostaInicial = {
  id: string | null
  status: StatusEfetivo
  distributorId: string
  destinoIata: string
  dataInicioISO: string
  duracaoDias: number
  parametros: Parametros
  validadeDias: number
  voos: Voos
  slug: string | null
  chave: string | null
  validaAte: string | null
  temEvento: boolean
}

type ChaveCusto = keyof Omit<Parametros, "acrescimoPct">
const CUSTOS: { chave: ChaveCusto; rotulo: string }[] = [
  { chave: "hotelDiaria", rotulo: "Hotel — diária por pessoa (R$)" },
  { chave: "alimentacaoDia", rotulo: "Alimentação — por dia, por pessoa (R$)" },
  { chave: "uberFixo", rotulo: "Uber — fixo por proposta (R$)" },
  { chave: "honorario", rotulo: "Honorário do treinamento (R$)" },
]

export function EditorClient({ inicial, distribuidores }: { inicial: PropostaInicial; distribuidores: Distribuidor[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [distributorId, setDistributorId] = useState(inicial.distributorId)
  const [destinoIata, setDestinoIata] = useState(inicial.destinoIata)
  const [dataInicioISO, setDataInicioISO] = useState(inicial.dataInicioISO)
  const [duracaoDias, setDuracaoDias] = useState(inicial.duracaoDias)
  const [custos, setCustos] = useState<Record<ChaveCusto | "acrescimoPct", string>>({
    hotelDiaria: formatarValorCampo(inicial.parametros.hotelDiaria),
    alimentacaoDia: formatarValorCampo(inicial.parametros.alimentacaoDia),
    uberFixo: formatarValorCampo(inicial.parametros.uberFixo),
    honorario: formatarValorCampo(inicial.parametros.honorario),
    acrescimoPct: formatarPercentual(inicial.parametros.acrescimoPct),
  })
  const [validadeDias, setValidadeDias] = useState(String(inicial.validadeDias))
  const [voos, setVoos] = useState<Voos>(inicial.voos)
  const [buscas, setBuscas] = useState<Partial<Record<OrigemId, ResultadoBusca>>>({})
  const [buscando, setBuscando] = useState(false)
  const [link, setLink] = useState(inicial.slug && inicial.chave ? { slug: inicial.slug, chave: inicial.chave, validaAte: inicial.validaAte } : null)

  const editavel = podeEditar(inicial.status)
  const lidos = {
    hotelDiaria: parseBRL(custos.hotelDiaria),
    alimentacaoDia: parseBRL(custos.alimentacaoDia),
    uberFixo: parseBRL(custos.uberFixo),
    honorario: parseBRL(custos.honorario),
    acrescimoPct: parsePercentual(custos.acrescimoPct),
  }
  const parametros: Parametros = {
    hotelDiaria: lidos.hotelDiaria ?? 0,
    alimentacaoDia: lidos.alimentacaoDia ?? 0,
    uberFixo: lidos.uberFixo ?? 0,
    honorario: lidos.honorario ?? 0,
    acrescimoPct: lidos.acrescimoPct ?? 0,
  }
  const algumInvalido = Object.values(lidos).some((v) => v === null)
  const calculo = calcularProposta({ destinoIata, duracaoDias, parametros, voos })
  const datas = dataInicioISO ? datasViagem(dataInicioISO, duracaoDias) : null
  const distribuidor = distribuidores.find((d) => d.id === distributorId)
  const rot = ROTULO_STATUS[inicial.status]

  // Destino, data ou duração novos invalidam os preços buscados (os manuais ficam).
  function mudouViagem() {
    setBuscas({})
    setVoos((v) => {
      const novo: Voos = {}
      for (const o of ORIGENS) if (v[o.id]?.modo === "manual") novo[o.id] = v[o.id]
      return novo
    })
  }

  function trocarDistribuidor(id: string) {
    setDistributorId(id)
    if (!destinoIata) {
      const s = sugerirAeroporto(distribuidores.find((d) => d.id === id)?.cidade ?? "")
      if (s) {
        setDestinoIata(s.iata)
        mudouViagem()
      }
    }
  }

  const payload = () => ({ distributorId, destinoIata, dataInicioISO, duracaoDias, parametros, validadeDias: Number(validadeDias), voos })

  async function buscar(forcar: boolean) {
    setErro(null)
    setBuscando(true)
    try {
      const r = await buscarVoos(destinoIata, dataInicioISO, duracaoDias, forcar)
      if (r.error || !r.resultados) {
        setErro(r.error ?? "Falha ao buscar voos.")
        return
      }
      const resultados = r.resultados
      setBuscas(resultados)
      setVoos((v) => {
        const novo: Voos = { ...v }
        for (const o of ORIGENS) {
          const res = resultados[o.id]
          if (res.ok && res.local) novo[o.id] = { modo: "local", preco: 0 }
          else if (res.ok && res.opcoes[0]) novo[o.id] = { modo: "serpapi", ...res.opcoes[0] }
        }
        return novo
      })
    } catch {
      setErro("Falha ao buscar voos.")
    } finally {
      setBuscando(false)
    }
  }

  function aposGravar(id?: string) {
    if (!inicial.id && id) router.replace(`/parceiro365/admin/propostas/${id}`)
    else router.refresh()
  }

  function salvar() {
    if (algumInvalido) return setErro("Corrija os valores destacados em vermelho.")
    iniciar(async () => {
      setErro(null)
      setAviso(null)
      const r = await salvarProposta(inicial.id, payload())
      if (r.error) return setErro(r.error)
      setAviso(inicial.status === "rascunho" ? "Rascunho salvo." : "Alterações salvas.")
      aposGravar(r.id)
    })
  }

  function enviar() {
    if (algumInvalido) return setErro("Corrija os valores destacados em vermelho.")
    iniciar(async () => {
      setErro(null)
      setAviso(null)
      const r = await gerarLink(inicial.id, payload())
      if (r.error || !r.slug || !r.chave) return setErro(r.error ?? "Não foi possível gerar o link.")
      setLink({ slug: r.slug, chave: r.chave, validaAte: r.validaAte ?? null })
      setAviso("Link pronto. Copie e envie ao distribuidor.")
      aposGravar(r.id)
    })
  }

  function cancelar() {
    if (!inicial.id) return
    const id = inicial.id
    iniciar(async () => {
      const r = await cancelarProposta(id)
      if (r.error) return setErro(r.error)
      router.refresh()
    })
  }

  const rotuloEnviar = inicial.status === "expirada" ? "Renovar e gerar link" : inicial.status === "enviada" ? "Reenviar com nova validade" : "Gerar link"

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", maxWidth: 1180 }}>
      <div style={{ flex: "1 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/parceiro365/admin/propostas" style={{ fontSize: 13, color: "#04377f", fontWeight: 700, textDecoration: "none" }}>
            ← Propostas
          </Link>
          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: rot.cor, background: rot.fundo }}>
            {rot.texto}
            {inicial.status === "aceita" && inicial.temEvento ? " · evento criado" : ""}
          </span>
        </div>

        <section style={card}>
          <h2 style={tituloSecao}>1. Distribuidor e treinamento</h2>
          <label htmlFor="distribuidor" style={label}>
            Distribuidor
          </label>
          <select id="distribuidor" className="pf365" disabled={!editavel} value={distributorId} onChange={(e) => trocarDistribuidor(e.target.value)} style={field}>
            <option value="">Escolha…</option>
            {distribuidores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
                {d.cidade ? ` — ${d.cidade}` : ""}
              </option>
            ))}
          </select>

          <label htmlFor="destino" style={label}>
            Aeroporto de destino
          </label>
          <CampoAeroporto
            id="destino"
            valor={destinoIata}
            disabled={!editavel}
            onChange={(iata) => {
              setDestinoIata(iata)
              mudouViagem()
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label htmlFor="data" style={label}>
                Data de início do treinamento
              </label>
              <input
                id="data"
                className="pf365"
                type="date"
                disabled={!editavel}
                value={dataInicioISO}
                onChange={(e) => {
                  setDataInicioISO(e.target.value)
                  mudouViagem()
                }}
                style={field}
              />
            </div>
            <div style={{ flex: "0 1 140px" }}>
              <label htmlFor="duracao" style={label}>
                Duração (dias)
              </label>
              <input
                id="duracao"
                className="pf365"
                type="number"
                min={1}
                max={10}
                disabled={!editavel}
                value={duracaoDias}
                onChange={(e) => {
                  setDuracaoDias(Math.min(10, Math.max(1, Math.floor(Number(e.target.value) || 1))))
                  mudouViagem()
                }}
                style={field}
              />
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={tituloSecao}>2. Passagens (ida e volta, por pessoa)</h2>
          {editavel && (
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button type="button" onClick={() => buscar(false)} disabled={buscando || !destinoIata || !dataInicioISO} style={{ ...botaoPrimario, opacity: buscando || !destinoIata || !dataInicioISO ? 0.6 : 1 }}>
                {buscando ? "Buscando…" : "Buscar voos"}
              </button>
              {Object.keys(buscas).length > 0 && (
                <button type="button" onClick={() => buscar(true)} disabled={buscando} style={botaoSecundario}>
                  Buscar de novo
                </button>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {ORIGENS.map((o) => (
              <ColunaVoos
                key={`${o.id}-${destinoIata}-${dataInicioISO}-${duracaoDias}`}
                origem={o}
                local={o.iata === destinoIata}
                resultado={buscas[o.id]}
                escolhido={voos[o.id]}
                editavel={editavel}
                onEscolher={(v: VooEscolhido | undefined) => setVoos((atual) => ({ ...atual, [o.id]: v }))}
              />
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={tituloSecao}>3. Custos desta proposta</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {CUSTOS.map((c) => (
              <div key={c.chave} style={{ flex: "1 1 220px" }}>
                <label htmlFor={c.chave} style={label}>
                  {c.rotulo}
                </label>
                <input
                  id={c.chave}
                  className="pf365"
                  inputMode="decimal"
                  disabled={!editavel}
                  value={custos[c.chave]}
                  onChange={(e) => setCustos((s) => ({ ...s, [c.chave]: e.target.value }))}
                  style={{ ...field, borderColor: lidos[c.chave] === null ? "#d6442f" : "#dde3ec" }}
                />
              </div>
            ))}
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="acrescimoPct" style={label}>
                Acréscimo sobre o total (%)
              </label>
              <input
                id="acrescimoPct"
                className="pf365"
                inputMode="decimal"
                disabled={!editavel}
                value={custos.acrescimoPct}
                onChange={(e) => setCustos((s) => ({ ...s, acrescimoPct: e.target.value }))}
                style={{ ...field, borderColor: lidos.acrescimoPct === null ? "#d6442f" : "#dde3ec" }}
              />
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label htmlFor="validadeDias" style={label}>
                Validade (dias)
              </label>
              <input id="validadeDias" className="pf365" type="number" min={1} max={60} disabled={!editavel} value={validadeDias} onChange={(e) => setValidadeDias(e.target.value)} style={field} />
            </div>
          </div>
        </section>

        {erro && <div role="alert" style={{ fontSize: 13.5, color: "#c0392b", fontWeight: 600 }}>{erro}</div>}
        {aviso && <div role="status" style={{ fontSize: 13.5, color: "#1e7b3c", fontWeight: 600 }}>{aviso}</div>}

        {editavel && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={salvar} disabled={pendente} style={botaoSecundario}>
              {inicial.status === "rascunho" ? "Salvar rascunho" : "Salvar alterações"}
            </button>
            <button type="button" onClick={enviar} disabled={pendente} style={{ ...botaoPrimario, opacity: pendente ? 0.75 : 1 }}>
              {pendente ? "Gravando…" : rotuloEnviar}
            </button>
            {inicial.id && (
              <button type="button" onClick={cancelar} disabled={pendente} style={{ ...botaoSecundario, color: "#b4232a", borderColor: "#f1c4c4", marginLeft: "auto" }}>
                Cancelar proposta
              </button>
            )}
          </div>
        )}

        {link && inicial.status !== "cancelada" && (
          <LinkGerado
            slug={link.slug}
            chave={link.chave}
            validaAte={link.validaAte}
            distribuidor={distribuidor?.nome ?? ""}
            cidade={aeroportoPorIata(destinoIata)?.cidade ?? ""}
            dataInicioISO={dataInicioISO}
          />
        )}
      </div>

      <div style={{ flex: "0 1 340px", minWidth: 280 }}>
        <Resumo calculo={calculo} datas={datas} />
      </div>
    </div>
  )
}
