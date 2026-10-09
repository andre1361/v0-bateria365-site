# Gerador de propostas de treinamento — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O super admin monta no Parceiro 365 uma proposta de treinamento com passagens da SerpApi e custos editáveis, envia um link com chave de acesso, e o distribuidor vê o total e aceita, o que cria o treinamento na agenda dele.

**Architecture:** Toda a regra (cálculo, datas, formatos, aeroportos, conversão da SerpApi, validação da entrada, status) fica em `lib/proposta/` como funções puras testadas com `bun test`. O banco ganha 3 tabelas Drizzle. As telas do admin ficam em `app/parceiro365/(portal)/admin/propostas/` (server actions com `requireAdmin()`), e a página pública com chave fica em `app/parceiro365/proposta/[slug]/`, no mesmo padrão do `emitir/[slug]`.

**Tech Stack:** Next.js 15 (App Router, server actions), React 19, TypeScript, Drizzle ORM + Neon (driver `neon-http`, sem transação interativa), bcryptjs, `bun test`. Estilos inline, como no restante do portal.

**Spec:** `docs/superpowers/specs/2026-10-08-gerador-propostas-design.md`

## Global Constraints

- Dinheiro sempre em **centavos inteiros**. Percentual em **centésimos de %** (650 = 6,5%).
- Padrões: hotel `35000`, alimentação `20000`, Uber `20000`, honorário `1200000`, acréscimo `0`, validade `10` dias.
- Origens fixas: `poa` (Porto Alegre, POA) e `sjp` (São José do Rio Preto, SJP). Sempre 2 pessoas.
- Datas: ida = início − 1 dia; volta = início + N dias. Hotel × (N + 1) × 2; alimentação × (N + 2) × 2; Uber fixo; honorário fixo.
- Duração de 1 a 10 dias. Validade de 1 a 60 dias.
- Cache de voos: 6 horas. No máximo 5 opções por origem.
- "Hoje" é sempre a data em `America/Sao_Paulo`.
- Server actions do admin chamam `requireAdmin()` de `app/parceiro365/guard.ts`. O total é sempre recalculado no servidor.
- `SERPAPI_API_KEY` só vem de `process.env`. Nunca no código, em log ou em commit.
- Textos da interface em português do Brasil. Mensagens de erro curtas e acionáveis.
- Testes em `lib/proposta/*.test.ts` com `import { describe, expect, test } from "bun:test"`. Dentro de `lib/`, imports relativos (`./x`). Em `app/`, use `@/lib/...`.
- Comandos: testes `bun test`, tipos `bunx tsc --noEmit` (o projeto passa limpo hoje; o build ignora erros de tipo, então o `tsc` é a checagem real).
- Commits terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Cidade do distribuidor com UF, acento ou caixa alta** ("Campinas - SP", "SÃO JOSÉ DO RIO PRETO/SP") → a sugestão de aeroporto ainda funciona. Testado na Task 3.
2. **Valores digitados no formato brasileiro** ("1.500", "1.500,50", "R$ 350", "", "-50", "12,345") → são aceitos com o valor certo ou recusados, nunca viram outro número. Testado na Task 1.
3. **Data de início hoje ou no passado, e "hoje" perto da meia-noite UTC** → "Gerar link" recusa, e o "hoje" segue o fuso de São Paulo. Testado nas Tasks 1 e 5.
4. **Resposta parcial da SerpApi** (item sem preço, sem trechos, só `other_flights`, erro de crédito ou de chave, exceção de rede) → devolve as opções válidas ou uma mensagem clara, nunca quebra. Testado na Task 4.
5. **Dados adulterados vindos do navegador** (preço negativo, duração 0 ou 50, IATA inexistente, modo de voo desconhecido, campos extras) → o servidor recusa ou ignora. Testado na Task 5.

---

## Mapa de arquivos

Criar:
- `lib/slug.ts` (+ `lib/slug.test.ts`): `slugify` compartilhado.
- `lib/proposta/formato.ts` (+ teste): moeda, percentual e datas.
- `lib/proposta/origens.ts`: as duas origens fixas.
- `lib/proposta/padroes.ts`: padrões de custo.
- `lib/proposta/calculo.ts` (+ teste): datas da viagem e total.
- `lib/proposta/aeroportos.ts` (+ teste): lista, busca e sugestão.
- `lib/proposta/serpapi.ts` (+ teste e `lib/proposta/fixtures/serpapi-poa-ssa.json`): URL, conversão e busca.
- `lib/proposta/status.ts` (+ teste): status efetivo, permissões, rótulos e validade.
- `lib/proposta/chave.ts` (+ teste): chave de acesso e token do cookie.
- `lib/proposta/entrada.ts` (+ teste): validação do que vem do editor.
- `db/migrations/0009_propostas.sql` (+ snapshot e journal gerados pelo drizzle-kit).
- `app/parceiro365/(portal)/admin/propostas/estilos.ts`, `server.ts`, `actions.ts`, `page.tsx`.
- `app/parceiro365/(portal)/admin/propostas/configuracoes/page.tsx`, `config-client.tsx`.
- `app/parceiro365/(portal)/admin/propostas/[id]/page.tsx`, `editor-client.tsx`, `campo-aeroporto.tsx`, `coluna-voos.tsx`, `resumo.tsx`, `link-gerado.tsx`.
- `app/parceiro365/proposta/[slug]/page.tsx`, `actions.ts`, `gate.tsx`, `aceite.tsx`, `imprimir.tsx`.

Modificar:
- `app/parceiro365/(portal)/eventos/actions.ts`: passa a usar `slugify` de `lib/slug.ts`.
- `db/schema.ts`: enum `proposal_status` e as tabelas `proposal_settings`, `proposals` e `flight_search_cache`.
- `app/parceiro365/sidebar.tsx`: item "Propostas" para o super admin.
- `auth.config.ts`: `/parceiro365/proposta/` como rota pública.

---

### Task 1: Formatos e slug compartilhado

**Files:**
- Create: `lib/slug.ts`, `lib/slug.test.ts`, `lib/proposta/formato.ts`, `lib/proposta/formato.test.ts`
- Modify: `app/parceiro365/(portal)/eventos/actions.ts:12-19` (remove o `slugify` local e importa o novo)

**Interfaces:**
- Produces:
  - `slugify(s: string): string`
  - `formatarBRL(centavos: number): string` → `"R$ 1.500,00"` (espaço normal, não NBSP)
  - `formatarValorCampo(centavos: number): string` → `"1.500,00"`
  - `parseBRL(texto: string): number | null` → centavos ou `null`
  - `formatarPercentual(centesimos: number): string` → `"6,5"`
  - `parsePercentual(texto: string): number | null` → centésimos (0 a 10000) ou `null`
  - `somarDiasISO(iso: string, dias: number): string`
  - `isoValida(iso: string): boolean`
  - `formatarDataISO(iso: string): string` → `"14/10/2026"`
  - `formatarDataComDia(iso: string): string` → `"ter 13/10"`
  - `dataISONoBrasil(d: Date): string` → `"2026-10-08"` no fuso de São Paulo
  - `formatarDuracao(min: number): string` → `"2h55"` / `"45min"`

- [ ] **Step 1: Write the failing tests**

`lib/slug.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { slugify } from "./slug"

describe("slugify", () => {
  test("remove acentos, espaços e símbolos", () => {
    expect(slugify("São José do Rio Preto - Treinamento")).toBe("sao-jose-do-rio-preto-treinamento")
  })
  test("texto vazio vira vazio", () => {
    expect(slugify("")).toBe("")
  })
})
```

`lib/proposta/formato.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import {
  dataISONoBrasil,
  formatarBRL,
  formatarDataComDia,
  formatarDataISO,
  formatarDuracao,
  formatarPercentual,
  formatarValorCampo,
  isoValida,
  parseBRL,
  parsePercentual,
  somarDiasISO,
} from "./formato"

describe("dinheiro", () => {
  test("formata em reais com espaço normal", () => {
    expect(formatarBRL(150000)).toBe("R$ 1.500,00")
    expect(formatarBRL(0)).toBe("R$ 0,00")
    expect(formatarBRL(1810000)).toBe("R$ 18.100,00")
  })

  test.each([
    ["350", 35000],
    ["350,00", 35000],
    ["1.500", 150000],
    ["1.500,50", 150050],
    ["1.500,5", 150050],
    ["R$ 12.000,00", 1200000],
    ["350.5", 35050],
    ["1.50", 150],
    [" 200 ", 20000],
    ["0", 0],
  ])("parseBRL(%p) = %p centavos", (texto, centavos) => {
    expect(parseBRL(texto as string)).toBe(centavos as number)
  })

  test.each(["", "-50", "12,345", "abc", "1.50.0", "1,5,0"])("parseBRL(%p) recusa", (texto) => {
    expect(parseBRL(texto)).toBeNull()
  })

  test("valor do campo volta igual pelo parse", () => {
    for (const c of [0, 99, 35000, 150050, 1200000]) expect(parseBRL(formatarValorCampo(c))).toBe(c)
    expect(formatarValorCampo(150050)).toBe("1.500,50")
  })
})

describe("percentual", () => {
  test.each([
    ["6,5", 650],
    ["6.5", 650],
    ["0", 0],
    ["10%", 1000],
    ["100", 10000],
  ])("parsePercentual(%p) = %p", (texto, v) => {
    expect(parsePercentual(texto as string)).toBe(v as number)
  })
  test.each(["101", "-1", "", "abc"])("parsePercentual(%p) recusa", (texto) => {
    expect(parsePercentual(texto)).toBeNull()
  })
  test("formata sem zeros à toa", () => {
    expect(formatarPercentual(650)).toBe("6,5")
    expect(formatarPercentual(0)).toBe("0")
  })
})

describe("datas", () => {
  test("soma dias atravessando mês, ano e bissexto", () => {
    expect(somarDiasISO("2026-10-31", 1)).toBe("2026-11-01")
    expect(somarDiasISO("2027-01-01", -1)).toBe("2026-12-31")
    expect(somarDiasISO("2028-02-28", 1)).toBe("2028-02-29")
  })
  test("valida AAAA-MM-DD de verdade", () => {
    expect(isoValida("2026-10-14")).toBe(true)
    expect(isoValida("2026-02-30")).toBe(false)
    expect(isoValida("14/10/2026")).toBe(false)
    expect(isoValida("")).toBe(false)
  })
  test("formata para exibição", () => {
    expect(formatarDataISO("2026-10-14")).toBe("14/10/2026")
    expect(formatarDataComDia("2026-10-13")).toBe("ter 13/10")
  })
  test("hoje segue o fuso de São Paulo", () => {
    expect(dataISONoBrasil(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-08")
    expect(dataISONoBrasil(new Date("2026-10-09T03:30:00Z"))).toBe("2026-10-09")
  })
  test("duração do voo", () => {
    expect(formatarDuracao(175)).toBe("2h55")
    expect(formatarDuracao(120)).toBe("2h00")
    expect(formatarDuracao(45)).toBe("45min")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test lib/slug.test.ts lib/proposta/formato.test.ts`
Expected: FAIL (`Cannot find module './slug'` / `'./formato'`)

- [ ] **Step 3: Write the implementation**

`lib/slug.ts`:
```ts
// Converte um texto em slug de URL (minúsculo, sem acento, separado por hífen).
export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
```

`lib/proposta/formato.ts`:
```ts
// Formatos e conversões das propostas. Dinheiro sempre em centavos (inteiros).

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const numero2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numeroAte2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const isoBrasil = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

export function formatarBRL(centavos: number): string {
  return moeda.format(centavos / 100).replace(/\s/g, " ")
}

// Valor para preencher um campo de texto ("1.500,00"); parseBRL lê de volta.
export function formatarValorCampo(centavos: number): string {
  return numero2.format(centavos / 100)
}

// Lê valores no formato brasileiro: ponto separa milhar e vírgula separa decimal.
// Sem vírgula, "1.500" é milhar e "350.5" é decimal. Negativos e lixo viram null.
export function parseBRL(texto: string): number | null {
  const t = (texto || "").replace(/R\$/gi, "").replace(/\s/g, "")
  if (!t) return null
  let normal: string
  if (t.includes(",")) {
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(t)) return null
    normal = t.replace(/\./g, "").replace(",", ".")
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    normal = t.replace(/\./g, "")
  } else if (/^\d+(\.\d{1,2})?$/.test(t)) {
    normal = t
  } else {
    return null
  }
  return Math.round(parseFloat(normal) * 100)
}

export function formatarPercentual(centesimos: number): string {
  return numeroAte2.format(centesimos / 100)
}

// "6,5" → 650 (centésimos de %). Aceita de 0 a 100%.
export function parsePercentual(texto: string): number | null {
  const t = (texto || "").replace(/%/g, "").replace(/\s/g, "")
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(t)) return null
  const v = Math.round(parseFloat(t.replace(",", ".")) * 100)
  return v <= 10000 ? v : null
}

function partes(iso: string): [number, number, number] {
  const [a, m, d] = iso.split("-").map(Number)
  return [a, m, d]
}

export function somarDiasISO(iso: string, dias: number): string {
  const [a, m, d] = partes(iso)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

export function isoValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [a, m, d] = partes(iso)
  const dt = new Date(Date.UTC(a, m - 1, d))
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function formatarDataISO(iso: string): string {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export function formatarDataComDia(iso: string): string {
  const [a, m, d] = partes(iso)
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
  return `${dia} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`
}

// Data (AAAA-MM-DD) de um instante no fuso de São Paulo.
export function dataISONoBrasil(d: Date): string {
  return isoBrasil.format(d)
}

export function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}
```

In `app/parceiro365/(portal)/eventos/actions.ts`, apague a função `slugify` local (linhas 12–19) e acrescente aos imports:
```ts
import { slugify } from "@/lib/slug"
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test lib/slug.test.ts lib/proposta/formato.test.ts && bunx tsc --noEmit`
Expected: todos PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add lib/slug.ts lib/slug.test.ts lib/proposta/formato.ts lib/proposta/formato.test.ts "app/parceiro365/(portal)/eventos/actions.ts"
git commit -m "Propostas: formatos de moeda, percentual e datas; slugify compartilhado

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Origens, padrões e cálculo da proposta

**Files:**
- Create: `lib/proposta/origens.ts`, `lib/proposta/padroes.ts`, `lib/proposta/calculo.ts`, `lib/proposta/calculo.test.ts`

**Interfaces:**
- Consumes: `somarDiasISO` (Task 1)
- Produces:
  - `type OrigemId = "poa" | "sjp"`; `ORIGENS: readonly { id: OrigemId; cidade: string; iata: string }[]`; `PESSOAS: number` (= 2)
  - `PADROES: { parametros: Parametros; validadeDias: number }`
  - `type Parametros = { hotelDiaria; alimentacaoDia; uberFixo; honorario; acrescimoPct }` (todos `number`)
  - `type VooEscolhido = { modo: "serpapi" | "manual" | "local"; preco: number; companhia?: string; partida?: string; chegada?: string; duracaoMin?: number; escalas?: number }`
  - `type Voos = Partial<Record<OrigemId, VooEscolhido>>`
  - `datasViagem(dataInicioISO: string, duracaoDias: number): { idaISO: string; voltaISO: string }`
  - `type Calculo = { passagens: Record<OrigemId, number | null>; totalPassagens; diarias; diasAlimentacao; hotel; alimentacao; uber; honorario; subtotal; acrescimo; total: number; completo: boolean }`
  - `calcularProposta(i: { destinoIata: string; duracaoDias: number; parametros: Parametros; voos: Voos }): Calculo`

- [ ] **Step 1: Write the failing test**

`lib/proposta/calculo.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { calcularProposta, datasViagem, type Voos } from "./calculo"
import { PADROES } from "./padroes"

const voos = (poa?: number, sjp?: number): Voos => ({
  ...(poa !== undefined ? { poa: { modo: "serpapi" as const, preco: poa } } : {}),
  ...(sjp !== undefined ? { sjp: { modo: "serpapi" as const, preco: sjp } } : {}),
})
const calc = (o: { destino?: string; dias?: number; voos?: Voos; acrescimoPct?: number }) =>
  calcularProposta({
    destinoIata: o.destino ?? "SSA",
    duracaoDias: o.dias ?? 1,
    parametros: { ...PADROES.parametros, acrescimoPct: o.acrescimoPct ?? 0 },
    voos: o.voos ?? voos(150000, 180000),
  })

describe("datasViagem", () => {
  test("ida no dia anterior e volta no dia seguinte ao fim", () => {
    expect(datasViagem("2026-10-14", 1)).toEqual({ idaISO: "2026-10-13", voltaISO: "2026-10-15" })
    expect(datasViagem("2026-10-14", 3)).toEqual({ idaISO: "2026-10-13", voltaISO: "2026-10-17" })
  })
  test("atravessa mês e ano", () => {
    expect(datasViagem("2026-11-01", 1).idaISO).toBe("2026-10-31")
    expect(datasViagem("2026-12-31", 3).voltaISO).toBe("2027-01-03")
    expect(datasViagem("2027-01-01", 1).idaISO).toBe("2026-12-31")
  })
})

describe("calcularProposta", () => {
  test("exemplo da spec: 1 dia, R$ 1.500 + R$ 1.800 = R$ 18.100", () => {
    const c = calc({})
    expect(c).toMatchObject({
      totalPassagens: 330000,
      diarias: 2,
      diasAlimentacao: 3,
      hotel: 140000,
      alimentacao: 120000,
      uber: 20000,
      honorario: 1200000,
      subtotal: 1810000,
      acrescimo: 0,
      total: 1810000,
      completo: true,
    })
  })

  test("3 dias: 4 diárias e 5 dias de alimentação por pessoa", () => {
    const c = calc({ dias: 3 })
    expect(c.hotel).toBe(35000 * 4 * 2)
    expect(c.alimentacao).toBe(20000 * 5 * 2)
    expect(c.total).toBe(330000 + 280000 + 200000 + 20000 + 1200000)
  })

  test("acréscimo percentual arredondado ao centavo", () => {
    expect(calc({ acrescimoPct: 650 }).total).toBe(1810000 + 117650)
    const quebrado = calc({ acrescimoPct: 650, voos: voos(150001, 180000) })
    expect(quebrado.acrescimo).toBe(117650) // 117650,065 → 117650
  })

  test("destino igual a uma origem: passagem zero sem precisar de voo", () => {
    const c = calc({ destino: "POA", voos: voos(undefined, 180000) })
    expect(c.passagens).toEqual({ poa: 0, sjp: 180000 })
    expect(c.completo).toBe(true)
    expect(c.total).toBe(180000 + 140000 + 120000 + 20000 + 1200000)
  })

  test("falta o voo de uma origem: incompleto, sem somar nada no lugar", () => {
    const c = calc({ voos: voos(150000) })
    expect(c.completo).toBe(false)
    expect(c.passagens.sjp).toBeNull()
    expect(c.totalPassagens).toBe(150000)
  })

  test("valor manual entra igual ao da SerpApi", () => {
    const c = calc({ voos: { poa: { modo: "manual", preco: 99900 }, sjp: { modo: "serpapi", preco: 100 } } })
    expect(c.totalPassagens).toBe(100000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/proposta/calculo.test.ts`
Expected: FAIL (`Cannot find module './calculo'`)

- [ ] **Step 3: Write the implementation**

`lib/proposta/origens.ts`:
```ts
// Os dois instrutores viajam sempre juntos, cada um da sua cidade.
export type OrigemId = "poa" | "sjp"

export const ORIGENS: readonly { id: OrigemId; cidade: string; iata: string }[] = [
  { id: "poa", cidade: "Porto Alegre", iata: "POA" },
  { id: "sjp", cidade: "São José do Rio Preto", iata: "SJP" },
]

export const PESSOAS = ORIGENS.length
```

`lib/proposta/padroes.ts`:
```ts
import type { Parametros } from "./calculo"

// Valem enquanto o super admin não gravar outros em Propostas → Configurações.
export const PADROES: { parametros: Parametros; validadeDias: number } = {
  parametros: { hotelDiaria: 35000, alimentacaoDia: 20000, uberFixo: 20000, honorario: 1200000, acrescimoPct: 0 },
  validadeDias: 10,
}
```

`lib/proposta/calculo.ts`:
```ts
import { somarDiasISO } from "./formato"
import { ORIGENS, PESSOAS, type OrigemId } from "./origens"

// Valores em centavos; acrescimoPct em centésimos de % (650 = 6,5%).
export type Parametros = {
  hotelDiaria: number
  alimentacaoDia: number
  uberFixo: number
  honorario: number
  acrescimoPct: number
}

export type VooEscolhido = {
  modo: "serpapi" | "manual" | "local"
  preco: number
  companhia?: string
  partida?: string
  chegada?: string
  duracaoMin?: number
  escalas?: number
}

export type Voos = Partial<Record<OrigemId, VooEscolhido>>

export type Calculo = {
  passagens: Record<OrigemId, number | null>
  totalPassagens: number
  diarias: number
  diasAlimentacao: number
  hotel: number
  alimentacao: number
  uber: number
  honorario: number
  subtotal: number
  acrescimo: number
  total: number
  completo: boolean
}

// Chegam um dia antes do treinamento e voltam no dia seguinte ao último dia.
export function datasViagem(dataInicioISO: string, duracaoDias: number) {
  return { idaISO: somarDiasISO(dataInicioISO, -1), voltaISO: somarDiasISO(dataInicioISO, duracaoDias) }
}

export function calcularProposta(i: {
  destinoIata: string
  duracaoDias: number
  parametros: Parametros
  voos: Voos
}): Calculo {
  const passagens = {} as Record<OrigemId, number | null>
  for (const o of ORIGENS) passagens[o.id] = o.iata === i.destinoIata ? 0 : (i.voos[o.id]?.preco ?? null)

  const valores = Object.values(passagens)
  const totalPassagens = valores.reduce<number>((s, v) => s + (v ?? 0), 0)
  const diarias = i.duracaoDias + 1
  const diasAlimentacao = i.duracaoDias + 2
  const hotel = i.parametros.hotelDiaria * diarias * PESSOAS
  const alimentacao = i.parametros.alimentacaoDia * diasAlimentacao * PESSOAS
  const uber = i.parametros.uberFixo
  const honorario = i.parametros.honorario
  const subtotal = totalPassagens + hotel + alimentacao + uber + honorario
  const acrescimo = Math.round((subtotal * i.parametros.acrescimoPct) / 10000)

  return {
    passagens,
    totalPassagens,
    diarias,
    diasAlimentacao,
    hotel,
    alimentacao,
    uber,
    honorario,
    subtotal,
    acrescimo,
    total: subtotal + acrescimo,
    completo: valores.every((v) => v !== null),
  }
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test lib/proposta/calculo.test.ts && bunx tsc --noEmit`
Expected: PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add lib/proposta/origens.ts lib/proposta/padroes.ts lib/proposta/calculo.ts lib/proposta/calculo.test.ts
git commit -m "Propostas: origens fixas, padrões e cálculo de datas e custos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Aeroportos — lista, busca e sugestão

**Files:**
- Create: `lib/proposta/aeroportos.ts`, `lib/proposta/aeroportos.test.ts`

**Interfaces:**
- Produces:
  - `type Aeroporto = { iata: string; nome: string; cidade: string; uf: string }`
  - `AEROPORTOS: readonly Aeroporto[]`
  - `normalizarTexto(s: string): string`
  - `aeroportoPorIata(iata: string): Aeroporto | undefined`
  - `buscarAeroportos(q: string, limite?: number): Aeroporto[]` (padrão 8)
  - `sugerirAeroporto(cidade: string): Aeroporto | null`

- [ ] **Step 1: Write the failing test**

`lib/proposta/aeroportos.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { AEROPORTOS, aeroportoPorIata, buscarAeroportos, sugerirAeroporto } from "./aeroportos"

describe("lista", () => {
  test("códigos únicos e com 3 letras", () => {
    const codigos = AEROPORTOS.map((a) => a.iata)
    expect(new Set(codigos).size).toBe(codigos.length)
    for (const c of codigos) expect(c).toMatch(/^[A-Z]{3}$/)
  })
  test("inclui as duas origens", () => {
    expect(aeroportoPorIata("POA")?.cidade).toBe("Porto Alegre")
    expect(aeroportoPorIata("SJP")?.cidade).toBe("São José do Rio Preto")
    expect(aeroportoPorIata("sjp")?.iata).toBe("SJP")
    expect(aeroportoPorIata("XXX")).toBeUndefined()
  })
})

describe("buscarAeroportos", () => {
  test("sem acento e sem caixa", () => {
    expect(buscarAeroportos("sao jose")[0].iata).toBe("SJP")
    expect(buscarAeroportos("RIBEIRAO")[0].iata).toBe("RAO")
  })
  test("código exato vem primeiro", () => {
    expect(buscarAeroportos("sjp")[0].iata).toBe("SJP")
    expect(buscarAeroportos("vcp")[0].iata).toBe("VCP")
  })
  test("busca pelo nome do aeroporto", () => {
    expect(buscarAeroportos("viracopos").map((a) => a.iata)).toContain("VCP")
  })
  test("vazio não lista nada e o limite é respeitado", () => {
    expect(buscarAeroportos("  ")).toEqual([])
    expect(buscarAeroportos("a", 3).length).toBe(3)
  })
})

describe("sugerirAeroporto", () => {
  test.each([
    ["Campinas - SP", "VCP"],
    ["SÃO JOSÉ DO RIO PRETO/SP", "SJP"],
    ["Ribeirão Preto, SP", "RAO"],
    ["São Paulo", "CGH"],
    ["Belo Horizonte (MG)", "CNF"],
    ["  salvador ", "SSA"],
    ["Ji-Paraná", "JPR"],
    ["Ji-Paraná - RO", "JPR"],
    ["Campinas-SP", "VCP"],
  ])("%p → %p", (cidade, iata) => {
    expect(sugerirAeroporto(cidade)?.iata).toBe(iata)
  })
  test("cidade sem aeroporto ou vazia → null", () => {
    expect(sugerirAeroporto("Cidadezinha")).toBeNull()
    expect(sugerirAeroporto("")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/proposta/aeroportos.test.ts`
Expected: FAIL (`Cannot find module './aeroportos'`)

- [ ] **Step 3: Write the implementation**

`lib/proposta/aeroportos.ts`:
```ts
// Aeroportos brasileiros com voo comercial regular. Nas cidades com mais de um,
// o primeiro listado é o sugerido (ex.: Congonhas antes de Guarulhos).
export type Aeroporto = { iata: string; nome: string; cidade: string; uf: string }

const a = (iata: string, nome: string, cidade: string, uf: string): Aeroporto => ({ iata, nome, cidade, uf })

export const AEROPORTOS: readonly Aeroporto[] = [
  a("RBR", "Aeroporto Internacional Plácido de Castro", "Rio Branco", "AC"),
  a("CZS", "Aeroporto Internacional de Cruzeiro do Sul", "Cruzeiro do Sul", "AC"),
  a("MCZ", "Aeroporto Internacional Zumbi dos Palmares", "Maceió", "AL"),
  a("MAO", "Aeroporto Internacional Eduardo Gomes", "Manaus", "AM"),
  a("TBT", "Aeroporto Internacional de Tabatinga", "Tabatinga", "AM"),
  a("MCP", "Aeroporto Internacional de Macapá", "Macapá", "AP"),
  a("SSA", "Aeroporto Internacional de Salvador", "Salvador", "BA"),
  a("IOS", "Aeroporto Jorge Amado", "Ilhéus", "BA"),
  a("BPS", "Aeroporto de Porto Seguro", "Porto Seguro", "BA"),
  a("VDC", "Aeroporto Glauber Rocha", "Vitória da Conquista", "BA"),
  a("BRA", "Aeroporto de Barreiras", "Barreiras", "BA"),
  a("LEC", "Aeroporto Horácio de Mattos", "Lençóis", "BA"),
  a("FOR", "Aeroporto Internacional Pinto Martins", "Fortaleza", "CE"),
  a("JDO", "Aeroporto Orlando Bezerra de Menezes", "Juazeiro do Norte", "CE"),
  a("BSB", "Aeroporto Internacional Presidente Juscelino Kubitschek", "Brasília", "DF"),
  a("VIX", "Aeroporto Eurico de Aguiar Salles", "Vitória", "ES"),
  a("GYN", "Aeroporto Internacional Santa Genoveva", "Goiânia", "GO"),
  a("RVD", "Aeroporto de Rio Verde", "Rio Verde", "GO"),
  a("CLV", "Aeroporto Nelson Rodrigues Guimarães", "Caldas Novas", "GO"),
  a("SLZ", "Aeroporto Internacional Marechal Cunha Machado", "São Luís", "MA"),
  a("IMP", "Aeroporto Prefeito Renato Moreira", "Imperatriz", "MA"),
  a("CNF", "Aeroporto Internacional de Confins", "Belo Horizonte", "MG"),
  a("PLU", "Aeroporto da Pampulha", "Belo Horizonte", "MG"),
  a("UDI", "Aeroporto Ten. Cel. Aviador César Bombonato", "Uberlândia", "MG"),
  a("UBA", "Aeroporto Mário de Almeida Franco", "Uberaba", "MG"),
  a("MOC", "Aeroporto Mário Ribeiro", "Montes Claros", "MG"),
  a("IZA", "Aeroporto Regional da Zona da Mata", "Juiz de Fora", "MG"),
  a("IPN", "Aeroporto do Vale do Aço", "Ipatinga", "MG"),
  a("GVR", "Aeroporto Coronel Altino Machado", "Governador Valadares", "MG"),
  a("VAG", "Aeroporto de Varginha", "Varginha", "MG"),
  a("CGR", "Aeroporto Internacional de Campo Grande", "Campo Grande", "MS"),
  a("DOU", "Aeroporto de Dourados", "Dourados", "MS"),
  a("CMG", "Aeroporto Internacional de Corumbá", "Corumbá", "MS"),
  a("TJL", "Aeroporto de Três Lagoas", "Três Lagoas", "MS"),
  a("CGB", "Aeroporto Internacional Marechal Rondon", "Cuiabá", "MT"),
  a("OPS", "Aeroporto de Sinop", "Sinop", "MT"),
  a("ROO", "Aeroporto de Rondonópolis", "Rondonópolis", "MT"),
  a("AFL", "Aeroporto de Alta Floresta", "Alta Floresta", "MT"),
  a("BEL", "Aeroporto Internacional de Belém", "Belém", "PA"),
  a("STM", "Aeroporto de Santarém", "Santarém", "PA"),
  a("MAB", "Aeroporto de Marabá", "Marabá", "PA"),
  a("ATM", "Aeroporto de Altamira", "Altamira", "PA"),
  a("CKS", "Aeroporto de Carajás", "Parauapebas", "PA"),
  a("JPA", "Aeroporto Internacional Presidente Castro Pinto", "João Pessoa", "PB"),
  a("CPV", "Aeroporto Presidente João Suassuna", "Campina Grande", "PB"),
  a("REC", "Aeroporto Internacional do Recife", "Recife", "PE"),
  a("PNZ", "Aeroporto Senador Nilo Coelho", "Petrolina", "PE"),
  a("THE", "Aeroporto Senador Petrônio Portella", "Teresina", "PI"),
  a("PHB", "Aeroporto Internacional de Parnaíba", "Parnaíba", "PI"),
  a("CWB", "Aeroporto Internacional Afonso Pena", "Curitiba", "PR"),
  a("LDB", "Aeroporto Governador José Richa", "Londrina", "PR"),
  a("MGF", "Aeroporto Regional de Maringá", "Maringá", "PR"),
  a("IGU", "Aeroporto Internacional de Foz do Iguaçu", "Foz do Iguaçu", "PR"),
  a("CAC", "Aeroporto de Cascavel", "Cascavel", "PR"),
  a("PGZ", "Aeroporto de Ponta Grossa", "Ponta Grossa", "PR"),
  a("TOW", "Aeroporto de Toledo", "Toledo", "PR"),
  a("SDU", "Aeroporto Santos Dumont", "Rio de Janeiro", "RJ"),
  a("GIG", "Aeroporto Internacional do Galeão", "Rio de Janeiro", "RJ"),
  a("CFB", "Aeroporto Internacional de Cabo Frio", "Cabo Frio", "RJ"),
  a("MEA", "Aeroporto de Macaé", "Macaé", "RJ"),
  a("CAW", "Aeroporto Bartolomeu Lysandro", "Campos dos Goytacazes", "RJ"),
  a("NAT", "Aeroporto Internacional de Natal", "Natal", "RN"),
  a("MVF", "Aeroporto de Mossoró", "Mossoró", "RN"),
  a("PVH", "Aeroporto Internacional Governador Jorge Teixeira", "Porto Velho", "RO"),
  a("JPR", "Aeroporto de Ji-Paraná", "Ji-Paraná", "RO"),
  a("BVH", "Aeroporto de Vilhena", "Vilhena", "RO"),
  a("OAL", "Aeroporto de Cacoal", "Cacoal", "RO"),
  a("BVB", "Aeroporto Internacional de Boa Vista", "Boa Vista", "RR"),
  a("POA", "Aeroporto Internacional Salgado Filho", "Porto Alegre", "RS"),
  a("CXJ", "Aeroporto Hugo Cantergiani", "Caxias do Sul", "RS"),
  a("PFB", "Aeroporto Lauro Kurtz", "Passo Fundo", "RS"),
  a("PET", "Aeroporto Internacional de Pelotas", "Pelotas", "RS"),
  a("RIA", "Aeroporto de Santa Maria", "Santa Maria", "RS"),
  a("GEL", "Aeroporto de Santo Ângelo", "Santo Ângelo", "RS"),
  a("URG", "Aeroporto de Uruguaiana", "Uruguaiana", "RS"),
  a("FLN", "Aeroporto Internacional de Florianópolis", "Florianópolis", "SC"),
  a("NVT", "Aeroporto Internacional de Navegantes", "Navegantes", "SC"),
  a("JOI", "Aeroporto Lauro Carneiro de Loyola", "Joinville", "SC"),
  a("XAP", "Aeroporto Serafin Enoss Bertaso", "Chapecó", "SC"),
  a("JJG", "Aeroporto Regional Sul (Criciúma/Tubarão)", "Jaguaruna", "SC"),
  a("AJU", "Aeroporto Santa Maria", "Aracaju", "SE"),
  a("CGH", "Aeroporto de Congonhas", "São Paulo", "SP"),
  a("GRU", "Aeroporto Internacional de Guarulhos", "São Paulo", "SP"),
  a("VCP", "Aeroporto Internacional de Viracopos", "Campinas", "SP"),
  a("RAO", "Aeroporto Leite Lopes", "Ribeirão Preto", "SP"),
  a("SJP", "Aeroporto Prof. Eribelto Manoel Reino", "São José do Rio Preto", "SP"),
  a("SJK", "Aeroporto Prof. Urbano Ernesto Stumpf", "São José dos Campos", "SP"),
  a("PPB", "Aeroporto de Presidente Prudente", "Presidente Prudente", "SP"),
  a("JTC", "Aeroporto Bauru-Arealva", "Bauru", "SP"),
  a("MII", "Aeroporto de Marília", "Marília", "SP"),
  a("ARU", "Aeroporto de Araçatuba", "Araçatuba", "SP"),
  a("PMW", "Aeroporto de Palmas", "Palmas", "TO"),
  a("AUX", "Aeroporto de Araguaína", "Araguaína", "TO"),
]

export function normalizarTexto(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/\s+/g, " ")
    .trim()
}

export function aeroportoPorIata(iata: string): Aeroporto | undefined {
  const c = (iata || "").trim().toUpperCase()
  return AEROPORTOS.find((x) => x.iata === c)
}

// Código exato primeiro, depois cidades que começam com o texto, depois qualquer
// correspondência em cidade, nome ou código. Mantém a ordem da lista no empate.
export function buscarAeroportos(q: string, limite = 8): Aeroporto[] {
  const n = normalizarTexto(q)
  if (!n) return []
  const pontos = (x: Aeroporto) => {
    if (x.iata.toLowerCase() === n) return 0
    if (normalizarTexto(x.cidade).startsWith(n)) return 1
    const alvo = normalizarTexto(`${x.cidade} ${x.nome} ${x.iata}`)
    return alvo.includes(n) ? 2 : -1
  }
  return AEROPORTOS.map((x, i) => ({ x, i, p: pontos(x) }))
    .filter((r) => r.p >= 0)
    .sort((r1, r2) => r1.p - r2.p || r1.i - r2.i)
    .slice(0, limite)
    .map((r) => r.x)
}

// A cidade do distribuidor é texto livre ("Campinas - SP", "Ribeirão Preto/SP").
// Tenta o texto inteiro ("Ji-Paraná"), depois corta antes de " - ", "/", "," ou "("
// ("Ji-Paraná - RO") e por fim em qualquer hífen ("Campinas-SP").
export function sugerirAeroporto(cidade: string): Aeroporto | null {
  const inteiro = normalizarTexto(cidade)
  if (!inteiro) return null
  const candidatos = [inteiro, inteiro.split(/\s+-\s+|[/,(]/)[0], inteiro.split(/[-/,(]/)[0]].map(normalizarTexto)
  for (const alvo of candidatos) {
    const achou = AEROPORTOS.find((x) => normalizarTexto(x.cidade) === alvo)
    if (achou) return achou
  }
  return null
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test lib/proposta/aeroportos.test.ts && bunx tsc --noEmit`
Expected: PASS; `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add lib/proposta/aeroportos.ts lib/proposta/aeroportos.test.ts
git commit -m "Propostas: lista de aeroportos com busca e sugestão pela cidade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Busca de voos na SerpApi

**Files:**
- Create: `lib/proposta/serpapi.ts`, `lib/proposta/serpapi.test.ts`, `lib/proposta/fixtures/serpapi-poa-ssa.json`

**Interfaces:**
- Produces:
  - `type OpcaoVoo = { preco: number; companhia: string; partida: string; chegada: string; duracaoMin: number; escalas: number }` (`preco` em centavos; `partida` e `chegada` como `"AAAA-MM-DD HH:MM"`)
  - `type BuscaVoos = { origem: string; destino: string; idaISO: string; voltaISO: string }`
  - `type ResultadoBusca = { ok: true; opcoes: OpcaoVoo[]; doCache?: boolean; local?: boolean } | { ok: false; erro: string }`
  - `MSG_VOOS: { semChave; chaveInvalida; semCredito; semVoos; falha }` (strings)
  - `urlBusca(b: BuscaVoos, apiKey: string): string`
  - `chaveCache(b: BuscaVoos): string`
  - `normalizarResposta(json: unknown): ResultadoBusca`
  - `buscarVoosSerpApi(b: BuscaVoos, apiKey: string | undefined, fetchFn?: typeof fetch): Promise<ResultadoBusca>`

A fixture segue o formato documentado da SerpApi Google Flights (`best_flights`/`other_flights`, cada item com `flights[]`, `price` em reais e `total_duration` em minutos). Quando houver uma chave, vale trocar por uma resposta real salva com a mesma estrutura.

- [ ] **Step 1: Write the fixture**

`lib/proposta/fixtures/serpapi-poa-ssa.json`:
```json
{
  "search_metadata": { "status": "Success" },
  "search_parameters": { "engine": "google_flights", "departure_id": "POA", "arrival_id": "SSA", "outbound_date": "2026-10-13", "return_date": "2026-10-15", "currency": "BRL", "type": "1" },
  "best_flights": [
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 06:05" }, "arrival_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 07:45" }, "duration": 100, "airline": "LATAM", "flight_number": "LA 3001" },
        { "departure_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 08:50" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 11:00" }, "duration": 130, "airline": "LATAM", "flight_number": "LA 3302" }
      ],
      "layovers": [{ "duration": 65, "name": "Aeroporto Internacional de Guarulhos", "id": "GRU" }],
      "total_duration": 295,
      "price": 1523,
      "type": "Round trip",
      "departure_token": "tok1"
    },
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 10:20" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 13:30" }, "duration": 190, "airline": "GOL", "flight_number": "G3 1650" }
      ],
      "total_duration": 190,
      "price": 1389,
      "type": "Round trip",
      "departure_token": "tok2"
    }
  ],
  "other_flights": [
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 07:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Confins", "id": "CNF", "time": "2026-10-13 09:10" }, "duration": 130, "airline": "Azul", "flight_number": "AD 4410" },
        { "departure_airport": { "name": "Aeroporto Internacional de Confins", "id": "CNF", "time": "2026-10-13 10:30" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 12:20" }, "duration": 110, "airline": "Azul", "flight_number": "AD 4822" }
      ],
      "total_duration": 320,
      "price": 1890
    },
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 05:30" }, "arrival_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 07:10" }, "duration": 100, "airline": "GOL", "flight_number": "G3 1100" },
        { "departure_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 09:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 11:15" }, "duration": 135, "airline": "LATAM", "flight_number": "LA 3500" }
      ],
      "total_duration": 345,
      "price": 2100
    },
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 12:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 15:10" }, "duration": 190, "airline": "GOL", "flight_number": "G3 1652" }
      ],
      "total_duration": 190
    },
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 14:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Viracopos", "id": "VCP", "time": "2026-10-13 15:40" }, "duration": 100, "airline": "Azul", "flight_number": "AD 2900" },
        { "departure_airport": { "name": "Aeroporto Internacional de Viracopos", "id": "VCP", "time": "2026-10-13 16:50" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 19:05" }, "duration": 135, "airline": "Azul", "flight_number": "AD 2950" }
      ],
      "total_duration": 305,
      "price": 1745
    },
    {
      "flights": [
        { "departure_airport": { "name": "Aeroporto Internacional Salgado Filho", "id": "POA", "time": "2026-10-13 18:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 19:40" }, "duration": 100, "airline": "LATAM", "flight_number": "LA 3010" },
        { "departure_airport": { "name": "Aeroporto Internacional de Guarulhos", "id": "GRU", "time": "2026-10-13 21:00" }, "arrival_airport": { "name": "Aeroporto Internacional de Salvador", "id": "SSA", "time": "2026-10-13 23:15" }, "duration": 135, "airline": "LATAM", "flight_number": "LA 3320" }
      ],
      "total_duration": 315,
      "price": 2450
    },
    { "flights": [], "total_duration": 0, "price": 999 }
  ]
}
```

- [ ] **Step 2: Write the failing test**

`lib/proposta/serpapi.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import fixture from "./fixtures/serpapi-poa-ssa.json"
import { MSG_VOOS, buscarVoosSerpApi, chaveCache, normalizarResposta, urlBusca, type BuscaVoos } from "./serpapi"

const busca: BuscaVoos = { origem: "POA", destino: "SSA", idaISO: "2026-10-13", voltaISO: "2026-10-15" }

describe("urlBusca e chaveCache", () => {
  test("monta a busca de ida e volta em reais", () => {
    const u = new URL(urlBusca(busca, "k123"))
    expect(u.origin + u.pathname).toBe("https://serpapi.com/search.json")
    expect(Object.fromEntries(u.searchParams)).toEqual({
      engine: "google_flights",
      departure_id: "POA",
      arrival_id: "SSA",
      outbound_date: "2026-10-13",
      return_date: "2026-10-15",
      type: "1",
      currency: "BRL",
      hl: "pt-br",
      gl: "br",
      adults: "1",
      api_key: "k123",
    })
  })
  test("chave do cache identifica rota e datas", () => {
    expect(chaveCache(busca)).toBe("POA-SSA-2026-10-13-2026-10-15")
  })
})

describe("normalizarResposta", () => {
  test("junta best e other, descarta sem preço ou sem trecho, ordena e limita a 5", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes.map((o) => o.preco)).toEqual([138900, 152300, 174500, 189000, 210000])
  })
  test("voo direto: companhia, horários, duração e zero escalas", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes[0]).toEqual({
      preco: 138900,
      companhia: "GOL",
      partida: "2026-10-13 10:20",
      chegada: "2026-10-13 13:30",
      duracaoMin: 190,
      escalas: 0,
    })
  })
  test("conexão com duas companhias", () => {
    const r = normalizarResposta(fixture)
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes[4]).toMatchObject({ companhia: "GOL + LATAM", escalas: 1, chegada: "2026-10-13 11:15" })
  })
  test("só other_flights também funciona", () => {
    const r = normalizarResposta({ other_flights: fixture.other_flights })
    if (!r.ok) throw new Error(r.erro)
    expect(r.opcoes.map((o) => o.preco)).toEqual([174500, 189000, 210000, 245000])
  })
  test("sem resultados → mensagem de nenhum voo", () => {
    expect(normalizarResposta({ error: "Google Flights hasn't returned any results for this query." })).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
    expect(normalizarResposta({ best_flights: [] })).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
    expect(normalizarResposta(null)).toEqual({ ok: false, erro: MSG_VOOS.semVoos })
  })
  test("erros de conta viram mensagens claras", () => {
    expect(normalizarResposta({ error: "Your account has run out of searches." })).toEqual({ ok: false, erro: MSG_VOOS.semCredito })
    expect(normalizarResposta({ error: "Invalid API key. Your API key should be here: ..." })).toEqual({ ok: false, erro: MSG_VOOS.chaveInvalida })
    expect(normalizarResposta({ error: "Something else" })).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
})

describe("buscarVoosSerpApi", () => {
  const resposta = (status: number, corpo: unknown) =>
    (async () => new Response(JSON.stringify(corpo), { status })) as unknown as typeof fetch

  test("sem chave nem chama a rede", async () => {
    let chamou = false
    const f = (async () => {
      chamou = true
      return new Response("{}")
    }) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, undefined, f)).toEqual({ ok: false, erro: MSG_VOOS.semChave })
    expect(chamou).toBe(false)
  })
  test("resposta boa → opções", async () => {
    const r = await buscarVoosSerpApi(busca, "k", resposta(200, fixture))
    expect(r.ok && r.opcoes.length).toBe(5)
  })
  test("401 com erro de chave → chave inválida", async () => {
    expect(await buscarVoosSerpApi(busca, "k", resposta(401, { error: "Invalid API key." }))).toEqual({ ok: false, erro: MSG_VOOS.chaveInvalida })
  })
  test("500 sem corpo JSON → falha genérica", async () => {
    const f = (async () => new Response("<html>erro</html>", { status: 500 })) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, "k", f)).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
  test("exceção de rede → falha genérica", async () => {
    const f = (async () => {
      throw new Error("offline")
    }) as unknown as typeof fetch
    expect(await buscarVoosSerpApi(busca, "k", f)).toEqual({ ok: false, erro: MSG_VOOS.falha })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test lib/proposta/serpapi.test.ts`
Expected: FAIL (`Cannot find module './serpapi'`)

- [ ] **Step 4: Write the implementation**

`lib/proposta/serpapi.ts`:
```ts
// Busca de passagens de ida e volta na SerpApi (Google Flights). A resposta lista
// as opções de IDA já com o preço TOTAL da viagem; os horários da volta exigiriam
// uma consulta extra por opção e ficam de fora.

export type OpcaoVoo = {
  preco: number // centavos, ida e volta
  companhia: string
  partida: string // "AAAA-MM-DD HH:MM" da ida
  chegada: string
  duracaoMin: number
  escalas: number
}

export type BuscaVoos = { origem: string; destino: string; idaISO: string; voltaISO: string }

export type ResultadoBusca =
  | { ok: true; opcoes: OpcaoVoo[]; doCache?: boolean; local?: boolean }
  | { ok: false; erro: string }

export const MSG_VOOS = {
  semChave: "Busca de voos não configurada — use o valor manual.",
  chaveInvalida: "Chave da SerpApi inválida — confira a configuração ou use o valor manual.",
  semCredito: "Créditos da SerpApi esgotados — use o valor manual.",
  semVoos: "Nenhum voo encontrado nessas datas.",
  falha: "Não foi possível buscar os voos agora — tente de novo ou use o valor manual.",
}

const MAX_OPCOES = 5

export function urlBusca(b: BuscaVoos, apiKey: string): string {
  const p = new URLSearchParams({
    engine: "google_flights",
    departure_id: b.origem,
    arrival_id: b.destino,
    outbound_date: b.idaISO,
    return_date: b.voltaISO,
    type: "1",
    currency: "BRL",
    hl: "pt-br",
    gl: "br",
    adults: "1",
    api_key: apiKey,
  })
  return `https://serpapi.com/search.json?${p}`
}

export function chaveCache(b: BuscaVoos): string {
  return `${b.origem}-${b.destino}-${b.idaISO}-${b.voltaISO}`
}

type Trecho = { departure_airport?: { time?: string }; arrival_airport?: { time?: string }; airline?: string }
type Itinerario = { flights?: Trecho[]; price?: number; total_duration?: number }

function erroDaConta(msg: string): string {
  if (/hasn't returned any results|no results/i.test(msg)) return MSG_VOOS.semVoos
  if (/run out of searches/i.test(msg)) return MSG_VOOS.semCredito
  if (/invalid api key/i.test(msg)) return MSG_VOOS.chaveInvalida
  return MSG_VOOS.falha
}

export function normalizarResposta(json: unknown): ResultadoBusca {
  const j = (json ?? {}) as { error?: string; best_flights?: Itinerario[]; other_flights?: Itinerario[] }
  const lista = [...(j.best_flights ?? []), ...(j.other_flights ?? [])]
  const opcoes = lista
    .flatMap((it): OpcaoVoo[] => {
      const trechos = it.flights ?? []
      if (typeof it.price !== "number" || it.price <= 0 || trechos.length === 0) return []
      const companhias = [...new Set(trechos.map((t) => t.airline).filter((x): x is string => !!x))]
      return [
        {
          preco: Math.round(it.price * 100),
          companhia: companhias.join(" + ") || "—",
          partida: trechos[0].departure_airport?.time ?? "",
          chegada: trechos[trechos.length - 1].arrival_airport?.time ?? "",
          duracaoMin: it.total_duration ?? 0,
          escalas: trechos.length - 1,
        },
      ]
    })
    .sort((x, y) => x.preco - y.preco)
    .slice(0, MAX_OPCOES)

  if (opcoes.length) return { ok: true, opcoes }
  if (j.error) return { ok: false, erro: erroDaConta(j.error) }
  return { ok: false, erro: MSG_VOOS.semVoos }
}

export async function buscarVoosSerpApi(
  b: BuscaVoos,
  apiKey: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoBusca> {
  if (!apiKey) return { ok: false, erro: MSG_VOOS.semChave }
  try {
    const r = await fetchFn(urlBusca(b, apiKey), { cache: "no-store", signal: AbortSignal.timeout(20000) })
    const json = (await r.json().catch(() => null)) as { error?: string } | null
    if (!r.ok && !json?.error) return { ok: false, erro: MSG_VOOS.falha }
    return normalizarResposta(json)
  } catch {
    return { ok: false, erro: MSG_VOOS.falha }
  }
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `bun test lib/proposta/serpapi.test.ts && bunx tsc --noEmit`
Expected: PASS; `tsc` sem saída. Se o `tsc` reclamar do import do JSON, confirme que `tsconfig.json` tem `"resolveJsonModule": true` e, se não tiver, adicione em `compilerOptions`.

- [ ] **Step 6: Commit**

```bash
git add lib/proposta/serpapi.ts lib/proposta/serpapi.test.ts lib/proposta/fixtures/serpapi-poa-ssa.json
git commit -m "Propostas: busca de voos na SerpApi com conversão e mensagens de erro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Status, chave de acesso e validação da entrada

**Files:**
- Create: `lib/proposta/status.ts`, `lib/proposta/status.test.ts`, `lib/proposta/chave.ts`, `lib/proposta/chave.test.ts`, `lib/proposta/entrada.ts`, `lib/proposta/entrada.test.ts`

**Interfaces:**
- Consumes: `aeroportoPorIata` (Task 3), `Parametros`, `VooEscolhido`, `Voos` (Task 2), `isoValida`, `somarDiasISO` (Task 1), `ORIGENS` (Task 2)
- Produces:
  - `type StatusGravado = "rascunho" | "enviada" | "aceita" | "cancelada"`; `type StatusEfetivo = StatusGravado | "expirada"`
  - `statusEfetivo(status: StatusGravado, validaAte: Date | null, agora?: Date): StatusEfetivo`
  - `podeEditar(s: StatusEfetivo): boolean`
  - `ROTULO_STATUS: Record<StatusEfetivo, { texto: string; cor: string; fundo: string }>`
  - `calcularValidade(agora: Date, dias: number): Date`
  - `gerarChave(tamanho?: number, sortear?: (max: number) => number): string`
  - `normalizarChave(s: string): string`
  - `propostaCookieName(slug: string): string`; `propostaToken(chaveHash: string, slug: string): string`
  - `UUID_RE: RegExp`
  - `type EntradaProposta = { distributorId: string; destinoIata: string; dataInicioISO: string; duracaoDias: number; parametros: Parametros; validadeDias: number; voos: Voos }`
  - `validarEntrada(raw: unknown, hojeISO: string, exigirCompleta: boolean): { ok: true; valor: EntradaProposta } | { ok: false; erro: string }`

- [ ] **Step 1: Write the failing tests**

`lib/proposta/status.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { calcularValidade, podeEditar, statusEfetivo } from "./status"

const agora = new Date("2026-10-08T15:00:00Z")

describe("statusEfetivo", () => {
  test("enviada dentro da validade continua enviada", () => {
    expect(statusEfetivo("enviada", new Date("2026-10-18T15:00:00Z"), agora)).toBe("enviada")
  })
  test("enviada vencida (ou exatamente no limite) vira expirada", () => {
    expect(statusEfetivo("enviada", new Date("2026-10-08T14:59:59Z"), agora)).toBe("expirada")
    expect(statusEfetivo("enviada", agora, agora)).toBe("expirada")
  })
  test("aceita, cancelada e rascunho não expiram", () => {
    expect(statusEfetivo("aceita", new Date("2020-01-01"), agora)).toBe("aceita")
    expect(statusEfetivo("cancelada", new Date("2020-01-01"), agora)).toBe("cancelada")
    expect(statusEfetivo("rascunho", null, agora)).toBe("rascunho")
  })
})

describe("podeEditar", () => {
  test.each([
    ["rascunho", true],
    ["enviada", true],
    ["expirada", true],
    ["aceita", false],
    ["cancelada", false],
  ] as const)("%p → %p", (s, esperado) => {
    expect(podeEditar(s)).toBe(esperado)
  })
})

test("validade soma dias corridos ao instante do envio", () => {
  expect(calcularValidade(agora, 10).toISOString()).toBe("2026-10-18T15:00:00.000Z")
})
```

`lib/proposta/chave.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { gerarChave, normalizarChave, propostaCookieName, propostaToken } from "./chave"

describe("gerarChave", () => {
  test("6 caracteres sem ambíguos (0, O, 1, I, L)", () => {
    for (let i = 0; i < 200; i++) expect(gerarChave()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
  })
  test("usa o sorteio injetado", () => {
    expect(gerarChave(6, () => 0)).toBe("AAAAAA")
  })
})

test("normaliza o que o distribuidor digita", () => {
  expect(normalizarChave(" ab3 k9x ")).toBe("AB3K9X")
})

describe("cookie da proposta", () => {
  test("nome por slug", () => {
    expect(propostaCookieName("salvador-treinamento-a1b2c3")).toBe("prop_salvador-treinamento-a1b2c3")
  })
  test("token muda com o slug e com o hash", () => {
    expect(propostaToken("h1", "a")).not.toBe(propostaToken("h1", "b"))
    expect(propostaToken("h1", "a")).not.toBe(propostaToken("h2", "a"))
    expect(propostaToken("h1", "a")).toBe(propostaToken("h1", "a"))
  })
})
```

`lib/proposta/entrada.test.ts`:
```ts
import { describe, expect, test } from "bun:test"
import { validarEntrada } from "./entrada"
import { PADROES } from "./padroes"

const HOJE = "2026-10-08"
const base = () => ({
  distributorId: "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b",
  destinoIata: "SSA",
  dataInicioISO: "2026-10-20",
  duracaoDias: 1,
  parametros: { ...PADROES.parametros },
  validadeDias: 10,
  voos: {
    poa: { modo: "serpapi", preco: 138900, companhia: "GOL", partida: "2026-10-19 10:20", chegada: "2026-10-19 13:30", duracaoMin: 190, escalas: 0 },
    sjp: { modo: "manual", preco: 180000 },
  },
})
const erro = (raw: unknown, completa = false) => {
  const r = validarEntrada(raw, HOJE, completa)
  return r.ok ? null : r.erro
}

describe("aceita o que é válido", () => {
  test("rascunho e envio", () => {
    expect(validarEntrada(base(), HOJE, false).ok).toBe(true)
    expect(validarEntrada(base(), HOJE, true).ok).toBe(true)
  })
  test("rascunho pode estar incompleto", () => {
    expect(validarEntrada({ ...base(), destinoIata: "", dataInicioISO: "", voos: {} }, HOJE, false).ok).toBe(true)
  })
  test("IATA em minúsculas é normalizado", () => {
    const r = validarEntrada({ ...base(), destinoIata: "ssa" }, HOJE, false)
    expect(r.ok && r.valor.destinoIata).toBe("SSA")
  })
})

describe("recusa dados adulterados", () => {
  test.each([
    [{ distributorId: "abc" }, "Escolha o distribuidor."],
    [{ destinoIata: "XXX" }, "Aeroporto de destino inválido."],
    [{ dataInicioISO: "2026-02-30" }, "Data do treinamento inválida."],
    [{ duracaoDias: 0 }, "A duração deve ser de 1 a 10 dias."],
    [{ duracaoDias: 50 }, "A duração deve ser de 1 a 10 dias."],
    [{ duracaoDias: 1.5 }, "A duração deve ser de 1 a 10 dias."],
    [{ validadeDias: 0 }, "A validade deve ser de 1 a 60 dias."],
  ])("%p", (troca, msg) => {
    expect(erro({ ...base(), ...troca })).toBe(msg)
  })
  test("custo negativo ou em texto", () => {
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, hotelDiaria: -1 } })).toBe("Revise os valores de custo.")
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, honorario: "12000" } })).toBe("Revise os valores de custo.")
    expect(erro({ ...base(), parametros: { ...PADROES.parametros, acrescimoPct: 10001 } })).toBe("Revise os valores de custo.")
  })
  test("voo com preço negativo ou modo desconhecido", () => {
    expect(erro({ ...base(), voos: { poa: { modo: "serpapi", preco: -100 } } })).toBe("Voo de Porto Alegre inválido.")
    expect(erro({ ...base(), voos: { sjp: { modo: "grátis", preco: 0 } } })).toBe("Voo de São José do Rio Preto inválido.")
  })
  test("campos extras são descartados", () => {
    const r = validarEntrada({ ...base(), total: 1, voos: { ...base().voos, xyz: { modo: "manual", preco: 1 } } }, HOJE, false)
    if (!r.ok) throw new Error(r.erro)
    expect("total" in r.valor).toBe(false)
    expect(Object.keys(r.valor.voos).sort()).toEqual(["poa", "sjp"])
  })
  test("destino igual a uma origem força passagem local zero", () => {
    const r = validarEntrada({ ...base(), destinoIata: "POA" }, HOJE, true)
    if (!r.ok) throw new Error(r.erro)
    expect(r.valor.voos.poa).toEqual({ modo: "local", preco: 0 })
  })
  test("modo local vindo do navegador para outro destino é descartado", () => {
    const r = validarEntrada({ ...base(), voos: { poa: { modo: "local", preco: 0 } } }, HOJE, false)
    expect(r.ok && r.valor.voos.poa).toBeUndefined()
  })
})

describe("exigências para gerar o link", () => {
  test("data a partir de amanhã (a ida é no dia anterior)", () => {
    expect(erro({ ...base(), dataInicioISO: HOJE }, true)).toBe("O treinamento precisa começar a partir de amanhã (a ida é no dia anterior).")
    expect(erro({ ...base(), dataInicioISO: "2026-10-01" }, true)).toBe("O treinamento precisa começar a partir de amanhã (a ida é no dia anterior).")
    expect(erro({ ...base(), dataInicioISO: "2026-10-09" }, true)).toBeNull()
  })
  test("destino e data obrigatórios", () => {
    expect(erro({ ...base(), destinoIata: "" }, true)).toBe("Escolha o aeroporto de destino.")
    expect(erro({ ...base(), dataInicioISO: "" }, true)).toBe("Informe a data do treinamento.")
  })
  test("voo das duas origens, com preço maior que zero", () => {
    expect(erro({ ...base(), voos: { poa: base().voos.poa } }, true)).toBe("Escolha o voo (ou informe o valor) de São José do Rio Preto.")
    expect(erro({ ...base(), voos: { ...base().voos, sjp: { modo: "manual", preco: 0 } } }, true)).toBe(
      "Escolha o voo (ou informe o valor) de São José do Rio Preto.",
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test lib/proposta/status.test.ts lib/proposta/chave.test.ts lib/proposta/entrada.test.ts`
Expected: FAIL (módulos não encontrados)

- [ ] **Step 3: Write the implementation**

`lib/proposta/status.ts`:
```ts
export type StatusGravado = "rascunho" | "enviada" | "aceita" | "cancelada"
export type StatusEfetivo = StatusGravado | "expirada"

// "Expirada" não é gravada: é uma enviada cuja validade já passou.
export function statusEfetivo(status: StatusGravado, validaAte: Date | null, agora = new Date()): StatusEfetivo {
  if (status === "enviada" && validaAte && validaAte.getTime() <= agora.getTime()) return "expirada"
  return status
}

export function podeEditar(s: StatusEfetivo): boolean {
  return s === "rascunho" || s === "enviada" || s === "expirada"
}

export const ROTULO_STATUS: Record<StatusEfetivo, { texto: string; cor: string; fundo: string }> = {
  rascunho: { texto: "Rascunho", cor: "#41506a", fundo: "#eef1f6" },
  enviada: { texto: "Enviada", cor: "#04377f", fundo: "#e6effb" },
  expirada: { texto: "Expirada", cor: "#9a6700", fundo: "#fff7ed" },
  aceita: { texto: "Aceita", cor: "#1e7b3c", fundo: "#e7f6ec" },
  cancelada: { texto: "Cancelada", cor: "#b4232a", fundo: "#fdecec" },
}

export function calcularValidade(agora: Date, dias: number): Date {
  return new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)
}
```

`lib/proposta/chave.ts`:
```ts
import { createHash, randomInt } from "crypto"

// Sem 0/O, 1/I/L, para não confundir quando a chave vai por WhatsApp.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function gerarChave(tamanho = 6, sortear: (max: number) => number = randomInt): string {
  let s = ""
  for (let i = 0; i < tamanho; i++) s += ALFABETO[sortear(ALFABETO.length)]
  return s
}

export function normalizarChave(s: string): string {
  return (s || "").replace(/\s/g, "").toUpperCase()
}

// Cookie e token da sessão de leitura da proposta (mesmo padrão do emitir/[slug]).
export const propostaCookieName = (slug: string) => `prop_${slug}`

export function propostaToken(chaveHash: string, slug: string): string {
  return createHash("sha256").update(`${chaveHash}::${slug}::proposta`).digest("hex")
}
```

`lib/proposta/entrada.ts`:
```ts
import { aeroportoPorIata } from "./aeroportos"
import type { Parametros, VooEscolhido, Voos } from "./calculo"
import { isoValida, somarDiasISO } from "./formato"
import { ORIGENS } from "./origens"

// Valida o que chega do editor do admin. Nada do navegador é confiável: valores
// fora de faixa são recusados e campos desconhecidos são descartados.

export type EntradaProposta = {
  distributorId: string
  destinoIata: string
  dataInicioISO: string
  duracaoDias: number
  parametros: Parametros
  validadeDias: number
  voos: Voos
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_VALOR = 100_000_000 // R$ 1 milhão
const MAX_PASSAGEM = 10_000_000 // R$ 100 mil

const inteiro = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null
const texto = (v: unknown, max: number): string | undefined => (typeof v === "string" ? v.trim().slice(0, max) : undefined)

function lerVoo(raw: unknown): VooEscolhido | null | "invalido" {
  if (raw == null) return null
  if (typeof raw !== "object") return "invalido"
  const r = raw as Record<string, unknown>
  if (r.modo !== "serpapi" && r.modo !== "manual" && r.modo !== "local") return "invalido"
  const preco = inteiro(r.preco, 0, MAX_PASSAGEM)
  if (preco === null) return "invalido"
  const voo: VooEscolhido = { modo: r.modo, preco }
  if (r.modo === "serpapi") {
    voo.companhia = texto(r.companhia, 80)
    voo.partida = texto(r.partida, 20)
    voo.chegada = texto(r.chegada, 20)
    voo.duracaoMin = inteiro(r.duracaoMin, 0, 10000) ?? undefined
    voo.escalas = inteiro(r.escalas, 0, 10) ?? undefined
  }
  return voo
}

export function validarEntrada(
  raw: unknown,
  hojeISO: string,
  exigirCompleta: boolean,
): { ok: true; valor: EntradaProposta } | { ok: false; erro: string } {
  if (!raw || typeof raw !== "object") return { ok: false, erro: "Dados inválidos." }
  const r = raw as Record<string, unknown>

  const distributorId = typeof r.distributorId === "string" ? r.distributorId : ""
  if (!UUID_RE.test(distributorId)) return { ok: false, erro: "Escolha o distribuidor." }

  const destinoIata = typeof r.destinoIata === "string" ? r.destinoIata.trim().toUpperCase() : ""
  if (destinoIata && !aeroportoPorIata(destinoIata)) return { ok: false, erro: "Aeroporto de destino inválido." }

  const dataInicioISO = typeof r.dataInicioISO === "string" ? r.dataInicioISO.trim() : ""
  if (dataInicioISO && !isoValida(dataInicioISO)) return { ok: false, erro: "Data do treinamento inválida." }

  const duracaoDias = inteiro(r.duracaoDias, 1, 10)
  if (duracaoDias === null) return { ok: false, erro: "A duração deve ser de 1 a 10 dias." }

  const validadeDias = inteiro(r.validadeDias, 1, 60)
  if (validadeDias === null) return { ok: false, erro: "A validade deve ser de 1 a 60 dias." }

  const p = (r.parametros ?? {}) as Record<string, unknown>
  const lidos = {
    hotelDiaria: inteiro(p.hotelDiaria, 0, MAX_VALOR),
    alimentacaoDia: inteiro(p.alimentacaoDia, 0, MAX_VALOR),
    uberFixo: inteiro(p.uberFixo, 0, MAX_VALOR),
    honorario: inteiro(p.honorario, 0, MAX_VALOR),
    acrescimoPct: inteiro(p.acrescimoPct, 0, 10000),
  }
  if (Object.values(lidos).some((v) => v === null)) return { ok: false, erro: "Revise os valores de custo." }
  const parametros = lidos as Parametros

  const brutos = (r.voos ?? {}) as Record<string, unknown>
  const voos: Voos = {}
  for (const o of ORIGENS) {
    const v = lerVoo(brutos[o.id])
    if (v === "invalido") return { ok: false, erro: `Voo de ${o.cidade} inválido.` }
    if (o.iata === destinoIata) voos[o.id] = { modo: "local", preco: 0 }
    else if (v && v.modo !== "local") voos[o.id] = v
  }

  if (exigirCompleta) {
    if (!destinoIata) return { ok: false, erro: "Escolha o aeroporto de destino." }
    if (!dataInicioISO) return { ok: false, erro: "Informe a data do treinamento." }
    if (dataInicioISO < somarDiasISO(hojeISO, 1)) {
      return { ok: false, erro: "O treinamento precisa começar a partir de amanhã (a ida é no dia anterior)." }
    }
    for (const o of ORIGENS) {
      const voo = voos[o.id]
      if (!voo || (voo.modo !== "local" && voo.preco <= 0)) {
        return { ok: false, erro: `Escolha o voo (ou informe o valor) de ${o.cidade}.` }
      }
    }
  }

  return { ok: true, valor: { distributorId, destinoIata, dataInicioISO, duracaoDias, parametros, validadeDias, voos } }
}
```

- [ ] **Step 4: Run all lib tests and typecheck**

Run: `bun test && bunx tsc --noEmit`
Expected: todos PASS (incluindo os 63 antigos); `tsc` sem saída.

- [ ] **Step 5: Commit**

```bash
git add lib/proposta/status.ts lib/proposta/status.test.ts lib/proposta/chave.ts lib/proposta/chave.test.ts lib/proposta/entrada.ts lib/proposta/entrada.test.ts
git commit -m "Propostas: status efetivo, chave de acesso e validação da entrada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tabelas no banco e migração

**Files:**
- Modify: `db/schema.ts` (adicionar ao final, antes dos `export type`, e acrescentar os tipos no bloco de tipos)
- Create (gerado): `db/migrations/0009_propostas.sql`, `db/migrations/meta/0009_snapshot.json`, `db/migrations/meta/_journal.json` (atualizado)

**Interfaces:**
- Consumes: `Parametros`, `Voos` (Task 2), `OpcaoVoo` (Task 4), só como tipo
- Produces: `proposalStatusEnum`, `proposalSettings`, `proposals`, `flightSearchCache`; tipos `Proposal`, `ProposalSettings`

**Não aplique a migração no banco nesta task.** A aplicação (`bun run db:migrate`) acontece na Task 11, com o Rafael.

- [ ] **Step 1: Add the tables to `db/schema.ts`**

No topo, junto aos imports existentes:
```ts
import type { Parametros, Voos } from "../lib/proposta/calculo"
import type { OpcaoVoo } from "../lib/proposta/serpapi"
```

Antes do bloco `export type User = ...`:
```ts
// Propostas de treinamento (só o super admin cria). Valores em centavos.
export const proposalStatusEnum = pgEnum("proposal_status", ["rascunho", "enviada", "aceita", "cancelada"])

// Padrões editáveis das propostas (uma linha, id "padrao"). Sem linha, valem os de lib/proposta/padroes.ts.
export const proposalSettings = pgTable("proposal_settings", {
  id: text("id").primaryKey().default("padrao"),
  hotelDiaria: integer("hotel_diaria").notNull(),
  alimentacaoDia: integer("alimentacao_dia").notNull(),
  uberFixo: integer("uber_fixo").notNull(),
  honorario: integer("honorario").notNull(),
  acrescimoPct: integer("acrescimo_pct").notNull().default(0),
  validadeDias: integer("validade_dias").notNull().default(10),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Gerados ao enviar pela primeira vez; ficam iguais ao renovar.
  slug: text("slug").unique(),
  chaveHash: text("chave_hash"),
  // Chave em texto para o admin reenviar por WhatsApp (como users.senhaPlain).
  chavePlain: text("chave_plain"),
  destinoIata: text("destino_iata").notNull().default(""),
  destinoCidade: text("destino_cidade").notNull().default(""),
  dataInicioISO: text("data_inicio_iso").notNull().default(""),
  duracaoDias: integer("duracao_dias").notNull().default(1),
  idaISO: text("ida_iso").notNull().default(""),
  voltaISO: text("volta_iso").notNull().default(""),
  // Cópia dos custos usados nesta proposta: mudar os padrões não altera propostas antigas.
  parametros: jsonb("parametros").$type<Parametros>().notNull(),
  validadeDias: integer("validade_dias").notNull().default(10),
  voos: jsonb("voos").$type<Voos>().notNull().default({}),
  total: integer("total").notNull().default(0),
  status: proposalStatusEnum("status").notNull().default("rascunho"),
  validaAte: timestamp("valida_ate", { withTimezone: true }),
  enviadaEm: timestamp("enviada_em", { withTimezone: true }),
  aceitaEm: timestamp("aceita_em", { withTimezone: true }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Cache das buscas na SerpApi (cada busca gasta crédito). Vale por 6h.
export const flightSearchCache = pgTable("flight_search_cache", {
  chave: text("chave").primaryKey(),
  resultados: jsonb("resultados").$type<OpcaoVoo[]>().notNull(),
  buscadoEm: timestamp("buscado_em", { withTimezone: true }).notNull().defaultNow(),
})
```

No bloco de tipos ao final:
```ts
export type Proposal = typeof proposals.$inferSelect
export type ProposalSettings = typeof proposalSettings.$inferSelect
```

- [ ] **Step 2: Generate the migration**

Run: `bunx drizzle-kit generate --name propostas`
Expected: cria `db/migrations/0009_propostas.sql` e `meta/0009_snapshot.json`. O drizzle-kit não conecta no banco para gerar.

- [ ] **Step 3: Review the generated SQL**

Run: `cat db/migrations/0009_propostas.sql`
Expected: só `CREATE TYPE "public"."proposal_status" ...`, `CREATE TABLE "flight_search_cache"`, `"proposal_settings"`, `"proposals"`, as duas `ALTER TABLE "proposals" ADD CONSTRAINT ... FOREIGN KEY` (users com cascade, events com set null) e o `UNIQUE` do slug, separados por `--> statement-breakpoint`. **Nenhum** `ALTER`/`DROP` em tabela existente. Se aparecer alguma mudança em tabela antiga, pare e reporte.

- [ ] **Step 4: Typecheck and tests**

Run: `bunx tsc --noEmit && bun test`
Expected: limpo; todos PASS.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts db/migrations/0009_propostas.sql db/migrations/meta/0009_snapshot.json db/migrations/meta/_journal.json
git commit -m "Propostas: tabelas de propostas, padrões e cache de voos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Camada de servidor do admin (dados e server actions)

**Files:**
- Create: `app/parceiro365/(portal)/admin/propostas/server.ts`, `app/parceiro365/(portal)/admin/propostas/actions.ts`

**Interfaces:**
- Consumes: tudo de `lib/proposta/*` (Tasks 1–5), tabelas da Task 6, `requireAdmin` de `app/parceiro365/guard.ts`, `slugify` de `lib/slug.ts`
- Produces:
  - `server.ts`: `obterConfiguracoes(): Promise<{ parametros: Parametros; validadeDias: number }>`, `buscarVoosComCache(b: BuscaVoos, forcar: boolean): Promise<ResultadoBusca>`
  - `actions.ts` (`"use server"`):
    - `salvarProposta(id: string | null, raw: unknown): Promise<{ error?: string; id?: string }>`
    - `gerarLink(id: string | null, raw: unknown): Promise<{ error?: string; id?: string; slug?: string; chave?: string; validaAte?: string }>`
    - `cancelarProposta(id: string): Promise<{ error?: string }>`
    - `buscarVoos(destinoIata: string, dataInicioISO: string, duracaoDias: number, forcar: boolean): Promise<{ error?: string; resultados?: Record<OrigemId, ResultadoBusca> }>`
    - `type ConfigState = { error?: string; ok?: string }`; `salvarConfiguracoes(_prev: ConfigState, formData: FormData): Promise<ConfigState>`

Esta camada fala com o banco e não tem teste unitário. Toda regra testável já está em `lib/`. A verificação é o `tsc` aqui e o teste no navegador na Task 11.

- [ ] **Step 1: Write `server.ts`**

```ts
import { and, eq, gt } from "drizzle-orm"
import { db } from "@/db"
import { flightSearchCache, proposalSettings } from "@/db/schema"
import type { Parametros } from "@/lib/proposta/calculo"
import { PADROES } from "@/lib/proposta/padroes"
import { buscarVoosSerpApi, chaveCache, type BuscaVoos, type ResultadoBusca } from "@/lib/proposta/serpapi"

const CACHE_MS = 6 * 60 * 60 * 1000

export async function obterConfiguracoes(): Promise<{ parametros: Parametros; validadeDias: number }> {
  const [s] = await db.select().from(proposalSettings).where(eq(proposalSettings.id, "padrao"))
  if (!s) return PADROES
  return {
    parametros: {
      hotelDiaria: s.hotelDiaria,
      alimentacaoDia: s.alimentacaoDia,
      uberFixo: s.uberFixo,
      honorario: s.honorario,
      acrescimoPct: s.acrescimoPct,
    },
    validadeDias: s.validadeDias,
  }
}

// Reaproveita a busca da mesma rota e datas por 6h para não gastar crédito da SerpApi.
// Só respostas com voos entram no cache.
export async function buscarVoosComCache(b: BuscaVoos, forcar: boolean): Promise<ResultadoBusca> {
  const chave = chaveCache(b)
  if (!forcar) {
    const [c] = await db
      .select()
      .from(flightSearchCache)
      .where(and(eq(flightSearchCache.chave, chave), gt(flightSearchCache.buscadoEm, new Date(Date.now() - CACHE_MS))))
    if (c) return { ok: true, opcoes: c.resultados, doCache: true }
  }
  const r = await buscarVoosSerpApi(b, process.env.SERPAPI_API_KEY)
  if (r.ok) {
    const agora = new Date()
    await db
      .insert(flightSearchCache)
      .values({ chave, resultados: r.opcoes, buscadoEm: agora })
      .onConflictDoUpdate({ target: flightSearchCache.chave, set: { resultados: r.opcoes, buscadoEm: agora } })
  }
  return r
}
```

- [ ] **Step 2: Write `actions.ts`**

```ts
"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, ne } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { proposalSettings, proposals, users } from "@/db/schema"
import { aeroportoPorIata } from "@/lib/proposta/aeroportos"
import { calcularProposta, datasViagem } from "@/lib/proposta/calculo"
import { gerarChave } from "@/lib/proposta/chave"
import { UUID_RE, validarEntrada, type EntradaProposta } from "@/lib/proposta/entrada"
import { dataISONoBrasil, isoValida, parseBRL, parsePercentual } from "@/lib/proposta/formato"
import { ORIGENS, type OrigemId } from "@/lib/proposta/origens"
import type { ResultadoBusca } from "@/lib/proposta/serpapi"
import { calcularValidade, podeEditar, statusEfetivo } from "@/lib/proposta/status"
import { slugify } from "@/lib/slug"
import { requireAdmin } from "../../../guard"
import { buscarVoosComCache } from "./server"

const LISTA = "/parceiro365/admin/propostas"

// Grava rascunho/alterações. O total é sempre recalculado aqui, nunca vem do navegador.
async function gravar(id: string | null, e: EntradaProposta): Promise<{ error?: string; id?: string }> {
  if (id && !UUID_RE.test(id)) return { error: "Proposta não encontrada." }
  const [dist] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, e.distributorId), eq(users.role, "distribuidor")))
  if (!dist) return { error: "Distribuidor não encontrado." }

  if (id) {
    const [atual] = await db
      .select({ status: proposals.status, validaAte: proposals.validaAte })
      .from(proposals)
      .where(eq(proposals.id, id))
    if (!atual) return { error: "Proposta não encontrada." }
    if (!podeEditar(statusEfetivo(atual.status, atual.validaAte))) return { error: "Esta proposta não pode mais ser editada." }
  }

  const datas = e.dataInicioISO ? datasViagem(e.dataInicioISO, e.duracaoDias) : { idaISO: "", voltaISO: "" }
  const valores = {
    distributorId: e.distributorId,
    destinoIata: e.destinoIata,
    destinoCidade: aeroportoPorIata(e.destinoIata)?.cidade ?? "",
    dataInicioISO: e.dataInicioISO,
    duracaoDias: e.duracaoDias,
    idaISO: datas.idaISO,
    voltaISO: datas.voltaISO,
    parametros: e.parametros,
    validadeDias: e.validadeDias,
    voos: e.voos,
    total: calcularProposta(e).total,
    updatedAt: new Date(),
  }

  if (id) {
    await db.update(proposals).set(valores).where(eq(proposals.id, id))
    return { id }
  }
  const [novo] = await db.insert(proposals).values(valores).returning({ id: proposals.id })
  return { id: novo.id }
}

export async function salvarProposta(id: string | null, raw: unknown): Promise<{ error?: string; id?: string }> {
  await requireAdmin()
  const v = validarEntrada(raw, dataISONoBrasil(new Date()), false)
  if (!v.ok) return { error: v.erro }
  const r = await gravar(id, v.valor)
  revalidatePath(LISTA)
  return r
}

// Envia (ou renova) a proposta: mesmo slug e mesma chave, nova validade.
export async function gerarLink(
  id: string | null,
  raw: unknown,
): Promise<{ error?: string; id?: string; slug?: string; chave?: string; validaAte?: string }> {
  await requireAdmin()
  const v = validarEntrada(raw, dataISONoBrasil(new Date()), true)
  if (!v.ok) return { error: v.erro }
  const g = await gravar(id, v.valor)
  if (g.error || !g.id) return g

  const [p] = await db
    .select({ slug: proposals.slug, chavePlain: proposals.chavePlain, chaveHash: proposals.chaveHash, destinoCidade: proposals.destinoCidade })
    .from(proposals)
    .where(eq(proposals.id, g.id))
  const slug =
    p.slug ?? `${slugify(`${p.destinoCidade}-treinamento`) || "treinamento"}-${randomUUID().replace(/-/g, "").slice(0, 6)}`
  const chave = p.chavePlain ?? gerarChave()
  const chaveHash = p.chaveHash ?? (await bcrypt.hash(chave, 10))
  const agora = new Date()
  const validaAte = calcularValidade(agora, v.valor.validadeDias)

  await db
    .update(proposals)
    .set({ slug, chavePlain: chave, chaveHash, status: "enviada", enviadaEm: agora, validaAte, updatedAt: agora })
    .where(eq(proposals.id, g.id))

  revalidatePath(LISTA)
  revalidatePath(`/parceiro365/proposta/${slug}`)
  return { id: g.id, slug, chave, validaAte: validaAte.toISOString() }
}

export async function cancelarProposta(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  if (!UUID_RE.test(id)) return { error: "Proposta não encontrada." }
  const [p] = await db
    .update(proposals)
    .set({ status: "cancelada", updatedAt: new Date() })
    .where(and(eq(proposals.id, id), ne(proposals.status, "aceita")))
    .returning({ id: proposals.id, slug: proposals.slug })
  if (!p) return { error: "Proposta aceita não pode ser cancelada." }
  revalidatePath(LISTA)
  if (p.slug) revalidatePath(`/parceiro365/proposta/${p.slug}`)
  return {}
}

export async function buscarVoos(
  destinoIata: string,
  dataInicioISO: string,
  duracaoDias: number,
  forcar: boolean,
): Promise<{ error?: string; resultados?: Record<OrigemId, ResultadoBusca> }> {
  await requireAdmin()
  if (!aeroportoPorIata(destinoIata)) return { error: "Escolha o aeroporto de destino." }
  if (!isoValida(dataInicioISO)) return { error: "Informe a data do treinamento." }
  if (!Number.isInteger(duracaoDias) || duracaoDias < 1 || duracaoDias > 10) return { error: "A duração deve ser de 1 a 10 dias." }
  const { idaISO, voltaISO } = datasViagem(dataInicioISO, duracaoDias)
  if (idaISO < dataISONoBrasil(new Date())) return { error: "A data da ida já passou." }

  const pares = await Promise.all(
    ORIGENS.map(async (o) => {
      const r: ResultadoBusca =
        o.iata === destinoIata
          ? { ok: true, opcoes: [], local: true }
          : await buscarVoosComCache({ origem: o.iata, destino: destinoIata, idaISO, voltaISO }, forcar)
      return [o.id, r] as const
    }),
  )
  return { resultados: Object.fromEntries(pares) as Record<OrigemId, ResultadoBusca> }
}

export type ConfigState = { error?: string; ok?: string }

export async function salvarConfiguracoes(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireAdmin()
  const dinheiro = (k: string) => parseBRL(String(formData.get(k) ?? ""))
  const hotelDiaria = dinheiro("hotelDiaria")
  const alimentacaoDia = dinheiro("alimentacaoDia")
  const uberFixo = dinheiro("uberFixo")
  const honorario = dinheiro("honorario")
  const acrescimoPct = parsePercentual(String(formData.get("acrescimoPct") ?? ""))
  const validadeDias = Number(formData.get("validadeDias"))
  if (hotelDiaria === null || alimentacaoDia === null || uberFixo === null || honorario === null || acrescimoPct === null) {
    return { error: "Revise os valores — use o formato 1.500,00 (e 6,5 no acréscimo)." }
  }
  if (!Number.isInteger(validadeDias) || validadeDias < 1 || validadeDias > 60) return { error: "A validade deve ser de 1 a 60 dias." }

  const valores = { hotelDiaria, alimentacaoDia, uberFixo, honorario, acrescimoPct, validadeDias, updatedAt: new Date() }
  await db
    .insert(proposalSettings)
    .values({ id: "padrao", ...valores })
    .onConflictDoUpdate({ target: proposalSettings.id, set: valores })
  revalidatePath(`${LISTA}/configuracoes`)
  return { ok: "Padrões salvos. Valem para as próximas propostas." }
}
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add "app/parceiro365/(portal)/admin/propostas/server.ts" "app/parceiro365/(portal)/admin/propostas/actions.ts"
git commit -m "Propostas: server actions do admin (salvar, enviar, cancelar, buscar voos, padrões)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Menu, lista de propostas e configurações

**Files:**
- Create: `app/parceiro365/(portal)/admin/propostas/estilos.ts`, `app/parceiro365/(portal)/admin/propostas/page.tsx`, `app/parceiro365/(portal)/admin/propostas/configuracoes/page.tsx`, `app/parceiro365/(portal)/admin/propostas/configuracoes/config-client.tsx`
- Modify: `app/parceiro365/sidebar.tsx:5` (import do ícone) e `:24-29` (item do super admin)

**Interfaces:**
- Consumes: `obterConfiguracoes` (Task 7), `salvarConfiguracoes`/`ConfigState` (Task 7), `ROTULO_STATUS`/`statusEfetivo` (Task 5), `formatarBRL`/`formatarDataISO`/`formatarValorCampo`/`formatarPercentual`/`dataISONoBrasil` (Task 1), `PageHeader` (`app/parceiro365/page-header.tsx`)
- Produces: `estilos.ts` com `field`, `label`, `card`, `botaoPrimario`, `botaoSecundario`, `tituloSecao` (`React.CSSProperties`), usados nas Tasks 9 e 10

- [ ] **Step 1: Write `estilos.ts`**

```ts
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
```

- [ ] **Step 2: Add the sidebar item**

In `app/parceiro365/sidebar.tsx`, acrescente `FileText` ao import do `lucide-react`:
```ts
import { LayoutGrid, Users, Store, Award, Mail, CalendarDays, Gift, Building2, Link2, HelpCircle, FileText, type LucideIcon } from "lucide-react"
```
E, na lista do `super_admin`, depois de "Distribuidores":
```ts
          { href: "/parceiro365/admin/propostas", label: "Propostas", icon: FileText },
```

- [ ] **Step 3: Write the list page `page.tsx`**

```tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { dataISONoBrasil, formatarBRL, formatarDataISO } from "@/lib/proposta/formato"
import { ROTULO_STATUS, statusEfetivo } from "@/lib/proposta/status"
import { PageHeader } from "../../../page-header"
import { requireAdmin } from "../../../guard"
import { botaoPrimario, botaoSecundario, card } from "./estilos"

const th: React.CSSProperties = { textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#6a7585", textTransform: "uppercase", letterSpacing: "0.04em", padding: "10px 12px", borderBottom: "1px solid #e6eaf1" }
const td: React.CSSProperties = { padding: "12px", fontSize: 13.5, borderBottom: "1px solid #f0f2f6", verticalAlign: "middle" }

export default async function PropostasPage() {
  await requireAdmin()
  const rows = await db
    .select({
      id: proposals.id,
      status: proposals.status,
      validaAte: proposals.validaAte,
      total: proposals.total,
      destinoCidade: proposals.destinoCidade,
      destinoIata: proposals.destinoIata,
      dataInicioISO: proposals.dataInicioISO,
      duracaoDias: proposals.duracaoDias,
      eventId: proposals.eventId,
      distribuidor: users.nome,
    })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.distributorId))
    .orderBy(desc(proposals.updatedAt))

  return (
    <>
      <PageHeader title="Propostas" subtitle="Propostas de treinamento para distribuidores" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <Link href="/parceiro365/admin/propostas/nova" style={botaoPrimario}>
            + Nova proposta
          </Link>
          <Link href="/parceiro365/admin/propostas/configuracoes" style={botaoSecundario}>
            Configurações
          </Link>
        </div>

        {rows.length === 0 ? (
          <div style={{ ...card, maxWidth: 1080, color: "#6a7585", fontSize: 14 }}>Nenhuma proposta ainda. Crie a primeira em “Nova proposta”.</div>
        ) : (
          <div style={{ ...card, padding: 0, maxWidth: 1080, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Distribuidor</th>
                  <th style={th}>Destino</th>
                  <th style={th}>Treinamento</th>
                  <th style={{ ...th, textAlign: "right" }}>Total</th>
                  <th style={th}>Status</th>
                  <th style={th}>Validade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ef = statusEfetivo(r.status, r.validaAte)
                  const rot = ROTULO_STATUS[ef]
                  return (
                    <tr key={r.id}>
                      <td style={td}>
                        <Link href={`/parceiro365/admin/propostas/${r.id}`} style={{ color: "#04377f", fontWeight: 700, textDecoration: "none" }}>
                          {r.distribuidor}
                        </Link>
                      </td>
                      <td style={td}>{r.destinoIata ? `${r.destinoCidade} (${r.destinoIata})` : "—"}</td>
                      <td style={td}>
                        {r.dataInicioISO ? `${formatarDataISO(r.dataInicioISO)} · ${r.duracaoDias} dia${r.duracaoDias > 1 ? "s" : ""}` : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{formatarBRL(r.total)}</td>
                      <td style={td}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: rot.cor, background: rot.fundo }}>
                          {rot.texto}
                          {ef === "aceita" && r.eventId ? " · evento criado" : ""}
                        </span>
                      </td>
                      <td style={td}>{r.validaAte ? formatarDataISO(dataISONoBrasil(r.validaAte)) : "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 4: Write `configuracoes/page.tsx`**

```tsx
import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { obterConfiguracoes } from "../server"
import { ConfigClient } from "./config-client"

export default async function ConfiguracoesPropostasPage() {
  await requireAdmin()
  const cfg = await obterConfiguracoes()
  return (
    <>
      <PageHeader title="Configurações das propostas" subtitle="Valores padrão de cada nova proposta" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <ConfigClient parametros={cfg.parametros} validadeDias={cfg.validadeDias} />
      </main>
    </>
  )
}
```

- [ ] **Step 5: Write `configuracoes/config-client.tsx`**

```tsx
"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { Parametros } from "@/lib/proposta/calculo"
import { formatarPercentual, formatarValorCampo } from "@/lib/proposta/formato"
import { salvarConfiguracoes, type ConfigState } from "../actions"
import { botaoPrimario, botaoSecundario, card, field, label } from "../estilos"

const initial: ConfigState = {}

const CAMPOS: { nome: keyof Omit<Parametros, "acrescimoPct">; rotulo: string; ajuda: string }[] = [
  { nome: "hotelDiaria", rotulo: "Hotel — diária por pessoa (R$)", ajuda: "Multiplicada pelas diárias e pelas 2 pessoas." },
  { nome: "alimentacaoDia", rotulo: "Alimentação — por dia, por pessoa (R$)", ajuda: "Multiplicada pelos dias de viagem e pelas 2 pessoas." },
  { nome: "uberFixo", rotulo: "Uber — fixo por proposta (R$)", ajuda: "Valor único para a dupla." },
  { nome: "honorario", rotulo: "Honorário do treinamento (R$)", ajuda: "Valor fixo por treinamento." },
]

export function ConfigClient({ parametros, validadeDias }: { parametros: Parametros; validadeDias: number }) {
  const [state, action, pending] = useActionState(salvarConfiguracoes, initial)
  return (
    <form action={action} style={{ ...card, maxWidth: 520 }}>
      {CAMPOS.map((c) => (
        <div key={c.nome}>
          <label htmlFor={c.nome} style={label}>
            {c.rotulo}
          </label>
          <input id={c.nome} className="pf365" name={c.nome} inputMode="decimal" defaultValue={formatarValorCampo(parametros[c.nome])} style={{ ...field, marginBottom: 4 }} required />
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#8792a2" }}>{c.ajuda}</p>
        </div>
      ))}
      <label htmlFor="acrescimoPct" style={label}>
        Acréscimo sobre o total (%)
      </label>
      <input id="acrescimoPct" className="pf365" name="acrescimoPct" inputMode="decimal" defaultValue={formatarPercentual(parametros.acrescimoPct)} style={field} required />
      <label htmlFor="validadeDias" style={label}>
        Validade da proposta (dias)
      </label>
      <input id="validadeDias" className="pf365" name="validadeDias" type="number" min={1} max={60} defaultValue={validadeDias} style={field} required />

      {state.error && <div style={{ margin: "0 0 12px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{state.error}</div>}
      {state.ok && <div style={{ margin: "0 0 12px", fontSize: 13, color: "#1e7b3c", fontWeight: 600 }}>{state.ok}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={pending} style={{ ...botaoPrimario, opacity: pending ? 0.75 : 1 }}>
          {pending ? "Salvando…" : "Salvar padrões"}
        </button>
        <Link href="/parceiro365/admin/propostas" style={botaoSecundario}>
          Voltar
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `bunx tsc --noEmit`
Expected: sem saída.

- [ ] **Step 7: Commit**

```bash
git add app/parceiro365/sidebar.tsx "app/parceiro365/(portal)/admin/propostas/estilos.ts" "app/parceiro365/(portal)/admin/propostas/page.tsx" "app/parceiro365/(portal)/admin/propostas/configuracoes"
git commit -m "Propostas: item no menu, lista e tela de padrões

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Editor da proposta

**Files:**
- Create em `app/parceiro365/(portal)/admin/propostas/[id]/`: `page.tsx`, `editor-client.tsx`, `campo-aeroporto.tsx`, `coluna-voos.tsx`, `resumo.tsx`, `link-gerado.tsx`

**Interfaces:**
- Consumes: actions da Task 7 (`salvarProposta`, `gerarLink`, `cancelarProposta`, `buscarVoos`), `obterConfiguracoes` (Task 7), `estilos.ts` (Task 8), `lib/proposta/*`
- Produces (tipos exportados por `editor-client.tsx`):
  - `type Distribuidor = { id: string; nome: string; cidade: string }`
  - `type PropostaInicial = { id: string | null; status: StatusEfetivo; distributorId: string; destinoIata: string; dataInicioISO: string; duracaoDias: number; parametros: Parametros; validadeDias: number; voos: Voos; slug: string | null; chave: string | null; validaAte: string | null; temEvento: boolean }`

Comportamento-chave:
- Mudar destino, data ou duração **limpa os voos da SerpApi** (os manuais ficam) e pede uma nova busca.
- Depois da busca, cada origem fica com a opção mais barata marcada.
- O resumo usa `calcularProposta` ao vivo. Campos de valor inválidos ficam com borda vermelha e entram como 0 no resumo.
- Proposta `aceita` ou `cancelada`: tudo fica desabilitado e os botões de ação somem.

- [ ] **Step 1: Write `page.tsx`**

```tsx
import { notFound } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { UUID_RE } from "@/lib/proposta/entrada"
import { statusEfetivo } from "@/lib/proposta/status"
import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { obterConfiguracoes } from "../server"
import { EditorClient, type PropostaInicial } from "./editor-client"

export default async function EditorPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const distribuidores = await db
    .select({ id: users.id, nome: users.nome, cidade: users.cidade })
    .from(users)
    .where(eq(users.role, "distribuidor"))
    .orderBy(asc(users.nome))

  let inicial: PropostaInicial
  if (id === "nova") {
    const cfg = await obterConfiguracoes()
    inicial = {
      id: null,
      status: "rascunho",
      distributorId: "",
      destinoIata: "",
      dataInicioISO: "",
      duracaoDias: 1,
      parametros: cfg.parametros,
      validadeDias: cfg.validadeDias,
      voos: {},
      slug: null,
      chave: null,
      validaAte: null,
      temEvento: false,
    }
  } else {
    if (!UUID_RE.test(id)) notFound()
    const [p] = await db.select().from(proposals).where(eq(proposals.id, id))
    if (!p) notFound()
    inicial = {
      id: p.id,
      status: statusEfetivo(p.status, p.validaAte),
      distributorId: p.distributorId,
      destinoIata: p.destinoIata,
      dataInicioISO: p.dataInicioISO,
      duracaoDias: p.duracaoDias,
      parametros: p.parametros,
      validadeDias: p.validadeDias,
      voos: p.voos,
      slug: p.slug,
      chave: p.chavePlain,
      validaAte: p.validaAte?.toISOString() ?? null,
      temEvento: !!p.eventId,
    }
  }

  return (
    <>
      <PageHeader title={inicial.id ? "Proposta" : "Nova proposta"} subtitle="Treinamento Bateria 365 — 2 instrutores (POA e SJP)" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <EditorClient key={inicial.id ?? "nova"} inicial={inicial} distribuidores={distribuidores} />
      </main>
    </>
  )
}
```

- [ ] **Step 2: Write `campo-aeroporto.tsx`**

```tsx
"use client"

import { useState } from "react"
import { aeroportoPorIata, buscarAeroportos } from "@/lib/proposta/aeroportos"
import { field } from "../estilos"

export function CampoAeroporto({ id, valor, onChange, disabled }: { id: string; valor: string; onChange: (iata: string) => void; disabled?: boolean }) {
  const sel = valor ? aeroportoPorIata(valor) : undefined
  // null = mostrando o aeroporto escolhido; string = o admin está digitando.
  const [q, setQ] = useState<string | null>(null)
  const opcoes = q ? buscarAeroportos(q) : []
  const rotulo = sel ? `${sel.cidade}/${sel.uf} (${sel.iata}) — ${sel.nome}` : ""

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        className="pf365"
        role="combobox"
        aria-expanded={opcoes.length > 0}
        aria-controls={`${id}-lista`}
        autoComplete="off"
        disabled={disabled}
        placeholder="Digite a cidade ou o código (ex.: Salvador, SSA)"
        value={q ?? rotulo}
        onFocus={() => setQ("")}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setQ(null)}
        style={field}
      />
      {opcoes.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 20, margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid #dde3ec", borderRadius: 10, boxShadow: "0 12px 30px rgba(16,33,60,0.12)" }}
        >
          {opcoes.map((a) => (
            <li key={a.iata} role="option" aria-selected={a.iata === valor}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(a.iata)
                  setQ(null)
                }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", minHeight: 44, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: "#1f2733" }}
              >
                {a.cidade}/{a.uf} <strong>{a.iata}</strong> <span style={{ color: "#8792a2", fontSize: 12 }}>{a.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `coluna-voos.tsx`**

```tsx
"use client"

import { useState } from "react"
import type { VooEscolhido } from "@/lib/proposta/calculo"
import { formatarBRL, formatarDuracao, formatarValorCampo, parseBRL } from "@/lib/proposta/formato"
import type { OpcaoVoo, ResultadoBusca } from "@/lib/proposta/serpapi"
import { field } from "../estilos"

const hora = (dt?: string) => (dt ? dt.slice(11, 16) : "")
const escalas = (n?: number) => (n ? `${n} escala${n > 1 ? "s" : ""}` : "direto")
const mesmoVoo = (v: VooEscolhido | undefined, o: OpcaoVoo) => v?.modo === "serpapi" && v.preco === o.preco && v.partida === o.partida

export function ColunaVoos({
  origem,
  local,
  resultado,
  escolhido,
  editavel,
  onEscolher,
}: {
  origem: { id: string; cidade: string; iata: string }
  local: boolean
  resultado?: ResultadoBusca
  escolhido?: VooEscolhido
  editavel: boolean
  onEscolher: (v: VooEscolhido | undefined) => void
}) {
  const [texto, setTexto] = useState(escolhido?.modo === "manual" ? formatarValorCampo(escolhido.preco) : "")
  const manual = escolhido?.modo === "manual"
  const invalido = manual && texto !== "" && parseBRL(texto) === null
  const grupo = `voo-${origem.id}`

  return (
    <div style={{ flex: "1 1 260px", border: "1px solid #e6eaf1", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>
        {origem.cidade} ({origem.iata})
      </div>

      {local ? (
        <p style={{ margin: 0, fontSize: 13, color: "#6a7585" }}>Treinamento na cidade do instrutor — sem passagem.</p>
      ) : (
        <>
          {resultado && !resultado.ok && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{resultado.erro}</p>}
          {resultado?.ok && resultado.doCache && <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "#8792a2" }}>Resultado guardado das últimas 6h.</p>}

          {resultado?.ok &&
            resultado.opcoes.map((o) => (
              <label key={`${o.partida}-${o.preco}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", minHeight: 44, marginBottom: 6, border: `1.5px solid ${mesmoVoo(escolhido, o) ? "#04377f" : "#e6eaf1"}`, borderRadius: 10, cursor: editavel ? "pointer" : "default", fontSize: 13 }}>
                <input type="radio" name={grupo} disabled={!editavel} checked={mesmoVoo(escolhido, o)} onChange={() => onEscolher({ modo: "serpapi", ...o })} />
                <span style={{ flex: 1 }}>
                  <strong>{o.companhia}</strong> · {hora(o.partida)}→{hora(o.chegada)} · {formatarDuracao(o.duracaoMin)} · {escalas(o.escalas)}
                </span>
                <strong>{formatarBRL(o.preco)}</strong>
              </label>
            ))}

          {!resultado && escolhido?.modo === "serpapi" && (
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>
              Escolhido: <strong>{escolhido.companhia}</strong> · {hora(escolhido.partida)}→{hora(escolhido.chegada)} · {escalas(escolhido.escalas)} ·{" "}
              <strong>{formatarBRL(escolhido.preco)}</strong>
            </p>
          )}

          <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44, fontSize: 13, cursor: editavel ? "pointer" : "default" }}>
            <input type="radio" name={grupo} disabled={!editavel} checked={manual} onChange={() => onEscolher({ modo: "manual", preco: parseBRL(texto) ?? 0 })} />
            Usar valor manual (ida e volta)
          </label>
          {manual && (
            <input
              className="pf365"
              aria-label={`Valor manual da passagem de ${origem.cidade}`}
              inputMode="decimal"
              placeholder="Ex.: 1.500,00"
              disabled={!editavel}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                onEscolher({ modo: "manual", preco: parseBRL(e.target.value) ?? 0 })
              }}
              style={{ ...field, marginBottom: 0, borderColor: invalido ? "#d6442f" : "#dde3ec" }}
            />
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `resumo.tsx`**

```tsx
import type { Calculo } from "@/lib/proposta/calculo"
import { formatarBRL, formatarDataComDia } from "@/lib/proposta/formato"
import { ORIGENS } from "@/lib/proposta/origens"
import { card } from "../estilos"

const linha: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f0f2f6" }

export function Resumo({ calculo, datas }: { calculo: Calculo; datas: { idaISO: string; voltaISO: string } | null }) {
  const c = calculo
  return (
    <aside style={{ ...card, position: "sticky", top: 84 }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Resumo (só você vê)</h2>
      {datas && (
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#41506a" }}>
          Ida: <strong>{formatarDataComDia(datas.idaISO)}</strong> · Volta: <strong>{formatarDataComDia(datas.voltaISO)}</strong>
        </p>
      )}
      {ORIGENS.map((o) => (
        <div key={o.id} style={linha}>
          <span>Passagem {o.cidade}</span>
          <span style={{ color: c.passagens[o.id] === null ? "#c0392b" : undefined }}>
            {c.passagens[o.id] === null ? "falta escolher" : formatarBRL(c.passagens[o.id] as number)}
          </span>
        </div>
      ))}
      <div style={linha}>
        <span>Hotel ({c.diarias} diárias × 2)</span>
        <span>{formatarBRL(c.hotel)}</span>
      </div>
      <div style={linha}>
        <span>Alimentação ({c.diasAlimentacao} dias × 2)</span>
        <span>{formatarBRL(c.alimentacao)}</span>
      </div>
      <div style={linha}>
        <span>Uber</span>
        <span>{formatarBRL(c.uber)}</span>
      </div>
      <div style={linha}>
        <span>Honorário</span>
        <span>{formatarBRL(c.honorario)}</span>
      </div>
      {c.acrescimo > 0 && (
        <div style={linha}>
          <span>Acréscimo</span>
          <span>{formatarBRL(c.acrescimo)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Total da proposta</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#04377f" }}>{formatarBRL(c.total)}</span>
      </div>
      {!c.completo && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9a6700" }}>O total ainda não inclui todas as passagens.</p>}
    </aside>
  )
}
```

- [ ] **Step 5: Write `link-gerado.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { dataISONoBrasil, formatarDataISO } from "@/lib/proposta/formato"
import { botaoSecundario, card } from "../estilos"

export function LinkGerado({ slug, chave, validaAte, distribuidor, cidade, dataInicioISO }: { slug: string; chave: string; validaAte: string | null; distribuidor: string; cidade: string; dataInicioISO: string }) {
  const [origin, setOrigin] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)
  useEffect(() => setOrigin(window.location.origin), [])

  const url = `${origin}/parceiro365/proposta/${slug}`
  const validade = validaAte ? formatarDataISO(dataISONoBrasil(new Date(validaAte))) : ""
  const mensagem = [
    `Olá, ${distribuidor}! Segue a proposta do Treinamento Bateria 365${cidade ? ` em ${cidade}` : ""}${dataInicioISO ? ` (${formatarDataISO(dataInicioISO)})` : ""}.`,
    `Acesse: ${url}`,
    `Chave de acesso: ${chave}`,
    validade ? `Válida até ${validade}.` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const copiar = (rotulo: string, texto: string) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(rotulo)
    setTimeout(() => setCopiado((c) => (c === rotulo ? null : c)), 1800)
  }

  return (
    <section style={{ ...card, borderColor: "#c9d6ea", background: "#f7faff" }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Link da proposta</h2>
      <p style={{ margin: "0 0 6px", fontSize: 13, wordBreak: "break-all" }}>{url}</p>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>
        Chave de acesso: <strong style={{ letterSpacing: "0.12em" }}>{chave}</strong>
      </p>
      {validade && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#6a7585" }}>Válida até {validade}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={botaoSecundario} onClick={() => copiar("link", url)}>
          {copiado === "link" ? "Copiado!" : "Copiar link"}
        </button>
        <button type="button" style={botaoSecundario} onClick={() => copiar("chave", chave)}>
          {copiado === "chave" ? "Copiada!" : "Copiar chave"}
        </button>
        <button type="button" style={botaoSecundario} onClick={() => copiar("msg", mensagem)}>
          {copiado === "msg" ? "Copiada!" : "Copiar mensagem para WhatsApp"}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Write `editor-client.tsx`**

```tsx
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
```

- [ ] **Step 7: Typecheck**

Run: `bunx tsc --noEmit`
Expected: sem saída.

- [ ] **Step 8: Commit**

```bash
git add "app/parceiro365/(portal)/admin/propostas/[id]"
git commit -m "Propostas: editor com busca de voos, custos, resumo ao vivo e link

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Página pública da proposta, chave e aceite

**Files:**
- Modify: `auth.config.ts` (bloco `authorized`)
- Create em `app/parceiro365/proposta/[slug]/`: `actions.ts`, `gate.tsx`, `aceite.tsx`, `imprimir.tsx`, `page.tsx`

**Interfaces:**
- Consumes: `normalizarChave`, `propostaCookieName`, `propostaToken` (Task 5), `statusEfetivo` (Task 5), `formatarBRL`, `formatarDataISO`, `dataISONoBrasil`, `somarDiasISO` (Task 1), `slugify` (Task 1), tabelas `proposals`, `users`, `events`
- Produces: `verificarChave(_prev: ChaveState, formData: FormData): Promise<ChaveState>`, `aceitarProposta(slug: string): Promise<{ error?: string }>`, `type ChaveState = { error?: string }`

- [ ] **Step 1: Make the route public in `auth.config.ts`**

Ao lado de `isEmitir`/`isConvite`:
```ts
      const isProposta = pathname.startsWith("/parceiro365/proposta/")
```
E troque a linha das rotas públicas por:
```ts
      if (isEmitir || isConvite || isProposta) return true
```

- [ ] **Step 2: Write `actions.ts`**

```ts
"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { and, eq, gt, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { events, proposals } from "@/db/schema"
import { normalizarChave, propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { slugify } from "@/lib/slug"

export type ChaveState = { error?: string }

const caminho = (slug: string) => `/parceiro365/proposta/${slug}`

export async function verificarChave(_prev: ChaveState, formData: FormData): Promise<ChaveState> {
  const slug = String(formData.get("slug") || "")
  const chave = normalizarChave(String(formData.get("chave") || ""))
  const [p] = await db.select({ chaveHash: proposals.chaveHash, status: proposals.status }).from(proposals).where(eq(proposals.slug, slug))
  if (!p || !p.chaveHash || p.status === "rascunho" || p.status === "cancelada") return { error: "Proposta indisponível." }

  const ok = await bcrypt.compare(chave, p.chaveHash)
  if (!ok) return { error: "Chave incorreta." }

  const c = await cookies()
  c.set(propostaCookieName(slug), propostaToken(p.chaveHash, slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: caminho(slug),
    maxAge: 60 * 60 * 6,
  })
  redirect(caminho(slug))
}

// Sem transação no driver neon-http: a proposta é "reservada" com um UPDATE
// condicional antes de criar o evento, e a reserva é desfeita se o evento falhar.
export async function aceitarProposta(slug: string): Promise<{ error?: string }> {
  const [p] = await db.select().from(proposals).where(eq(proposals.slug, slug))
  if (!p || !p.chaveHash) return { error: "Proposta indisponível." }
  const c = await cookies()
  if (c.get(propostaCookieName(slug))?.value !== propostaToken(p.chaveHash, slug)) {
    return { error: "Sessão expirada — informe a chave de acesso novamente." }
  }

  const [reservada] = await db
    .update(proposals)
    .set({ status: "aceita", aceitaEm: new Date(), updatedAt: new Date() })
    .where(and(eq(proposals.id, p.id), eq(proposals.status, "enviada"), gt(proposals.validaAte, sql`now()`)))
    .returning({ id: proposals.id })
  if (!reservada) {
    revalidatePath(caminho(slug))
    return { error: "Esta proposta não pode mais ser aceita." }
  }

  try {
    const eventoSlug = (slugify(`${p.destinoCidade}-treinamento-bateria-365`) || "evento") + "-" + randomUUID().replace(/-/g, "").slice(0, 6)
    const [ev] = await db
      .insert(events)
      .values({ distributorId: p.distributorId, titulo: "Treinamento Bateria 365", dataISO: p.dataInicioISO, cidade: p.destinoCidade, slug: eventoSlug })
      .returning({ id: events.id })
    await db.update(proposals).set({ eventId: ev.id }).where(eq(proposals.id, p.id))
  } catch {
    await db.update(proposals).set({ status: "enviada", aceitaEm: null, updatedAt: new Date() }).where(eq(proposals.id, p.id))
    return { error: "Não foi possível concluir o aceite — tente de novo." }
  }

  revalidatePath(caminho(slug))
  revalidatePath("/parceiro365/admin/propostas")
  revalidatePath("/parceiro365/eventos")
  return {}
}
```

- [ ] **Step 3: Write `gate.tsx`**

```tsx
"use client"

import { useActionState } from "react"
import { verificarChave, type ChaveState } from "./actions"

const initial: ChaveState = {}

export function PropostaGate({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(verificarChave, initial)
  return (
    <div style={{ maxWidth: 420, margin: "8vh auto 0", background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, boxShadow: "0 12px 40px rgba(16,33,60,0.10)", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#eef4fc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>🔒</div>
      <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Proposta protegida</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "#6a7585" }}>Informe a chave de acesso enviada pela equipe Bateria 365.</p>
      <form action={action}>
        <input type="hidden" name="slug" value={slug} />
        <input
          className="pf365"
          name="chave"
          aria-label="Chave de acesso"
          placeholder="Chave de acesso"
          autoComplete="off"
          autoCapitalize="characters"
          required
          style={{ width: "100%", height: 46, padding: "0 14px", fontSize: 16, letterSpacing: "0.12em", border: "1.5px solid #dde3ec", borderRadius: 11, color: "#1f2733", textAlign: "center" }}
        />
        {state.error && <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: "#c0392b", fontWeight: 600 }}>{state.error}</div>}
        <button type="submit" disabled={pending} style={{ width: "100%", height: 46, marginTop: 18, background: "#04377f", color: "#fff", border: "none", borderRadius: 11, fontSize: 14.5, fontWeight: 700, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.75 : 1 }}>
          {pending ? "Verificando…" : "Ver proposta"}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Write `aceite.tsx` and `imprimir.tsx`**

`aceite.tsx` (confirmação em dois passos na própria página, sem `window.confirm`):
```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { aceitarProposta } from "./actions"

const base: React.CSSProperties = { height: 48, padding: "0 22px", borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: "pointer" }

export function Aceite({ slug }: { slug: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  const confirmar = () =>
    iniciar(async () => {
      setErro(null)
      const r = await aceitarProposta(slug)
      if (r.error) setErro(r.error)
      router.refresh()
    })

  return (
    <div className="nao-imprimir" style={{ marginTop: 18, textAlign: "center" }}>
      {!confirmando ? (
        <button type="button" onClick={() => setConfirmando(true)} style={{ ...base, width: "100%", background: "#1e7b3c", color: "#fff", border: "none" }}>
          Aceitar proposta
        </button>
      ) : (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>Confirma o aceite? O treinamento entra na sua agenda do Parceiro 365.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={confirmar} disabled={pendente} style={{ ...base, background: "#1e7b3c", color: "#fff", border: "none", opacity: pendente ? 0.75 : 1 }}>
              {pendente ? "Confirmando…" : "Confirmar aceite"}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} disabled={pendente} style={{ ...base, background: "#fff", color: "#41506a", border: "1.5px solid #dde3ec" }}>
              Voltar
            </button>
          </div>
        </div>
      )}
      {erro && <div role="alert" style={{ marginTop: 10, fontSize: 13, color: "#c0392b", fontWeight: 600 }}>{erro}</div>}
    </div>
  )
}
```

`imprimir.tsx`:
```tsx
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
```

- [ ] **Step 5: Write `page.tsx`**

```tsx
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { proposals, users } from "@/db/schema"
import { propostaCookieName, propostaToken } from "@/lib/proposta/chave"
import { dataISONoBrasil, formatarBRL, formatarDataISO, somarDiasISO } from "@/lib/proposta/formato"
import { statusEfetivo } from "@/lib/proposta/status"
import { Aceite } from "./aceite"
import { PropostaGate } from "./gate"
import { BotaoImprimir } from "./imprimir"

export const metadata: Metadata = {
  title: "Proposta de treinamento — Bateria 365",
  robots: { index: false, follow: false },
}

const caixa: React.CSSProperties = { maxWidth: 420, margin: "8vh auto 0", background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: 34, textAlign: "center" }

export default async function PropostaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [row] = await db
    .select({ p: proposals, nome: users.nome, cidade: users.cidade })
    .from(proposals)
    .innerJoin(users, eq(users.id, proposals.distributorId))
    .where(eq(proposals.slug, slug))
  const disponivel = !!row && !!row.p.chaveHash && row.p.status !== "rascunho" && row.p.status !== "cancelada"

  let authed = false
  if (disponivel) {
    const c = await cookies()
    authed = c.get(propostaCookieName(slug))?.value === propostaToken(row.p.chaveHash as string, slug)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f6", color: "#1f2733" }}>
      <style>{"@media print { .nao-imprimir { display: none !important } body { background: #fff } }"}</style>
      <div className="nao-imprimir" style={{ height: 64, background: "#04377f", display: "flex", alignItems: "center", padding: "0 22px", gap: 11, color: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-bateria365-escuro.png" alt="Bateria 365" style={{ height: 32, width: "auto" }} />
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#bcd0ec" }}>Proposta de treinamento</span>
      </div>

      {!disponivel ? (
        <div style={caixa}>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800 }}>Proposta indisponível</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "#6a7585" }}>Este link não existe ou a proposta não está mais disponível.</p>
        </div>
      ) : !authed ? (
        <PropostaGate slug={slug} />
      ) : (
        <Conteudo p={row.p} nome={row.nome} cidade={row.cidade} />
      )}
    </div>
  )
}

function Conteudo({ p, nome, cidade }: { p: typeof proposals.$inferSelect; nome: string; cidade: string }) {
  const status = statusEfetivo(p.status, p.validaAte)
  const n = p.duracaoDias
  const periodo = n === 1 ? formatarDataISO(p.dataInicioISO) : `${formatarDataISO(p.dataInicioISO)} a ${formatarDataISO(somarDiasISO(p.dataInicioISO, n - 1))}`
  const validade = p.validaAte ? formatarDataISO(dataISONoBrasil(p.validaAte)) : ""
  const item: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #f0f2f6", fontSize: 14 }

  return (
    <div style={{ maxWidth: 560, margin: "5vh auto 40px", padding: "0 16px" }}>
      <div style={{ background: "#fff", border: "1px solid #e3e7ee", borderRadius: 18, padding: "30px 26px", opacity: status === "expirada" ? 0.6 : 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6a7585" }}>Proposta de treinamento</div>
        <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 800 }}>Treinamento Bateria 365</h1>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "#41506a" }}>
          Para <strong>{nome}</strong>
          {cidade ? ` · ${cidade}` : ""}
        </p>
        <div style={item}>
          <span>Data</span>
          <strong>{periodo}</strong>
        </div>
        <div style={item}>
          <span>Duração</span>
          <strong>
            {n} dia{n > 1 ? "s" : ""}
          </strong>
        </div>
        <div style={item}>
          <span>Local</span>
          <strong>{p.destinoCidade}</strong>
        </div>
        <div style={{ margin: "22px 0 8px", padding: "18px 16px", background: "#f2f6fc", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#41506a", fontWeight: 700 }}>Investimento total</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#04377f", marginTop: 4 }}>{formatarBRL(p.total)}</div>
        </div>
        <p style={{ margin: "10px 0 6px", fontSize: 13, color: "#41506a" }}>O valor inclui honorário dos instrutores, passagens aéreas, hospedagem, alimentação e transporte.</p>
        {validade && <p style={{ margin: 0, fontSize: 13, color: "#6a7585" }}>Proposta válida até {validade}.</p>}
      </div>

      {status === "enviada" && <Aceite slug={p.slug as string} />}
      {status === "expirada" && (
        <p style={{ marginTop: 16, padding: 14, background: "#fff7ed", border: "1px solid #f4d9ae", borderRadius: 12, color: "#9a6700", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta expirada — fale com a equipe Bateria 365 para renovar.
        </p>
      )}
      {status === "aceita" && (
        <p style={{ marginTop: 16, padding: 14, background: "#e7f6ec", border: "1px solid #bfe3cb", borderRadius: 12, color: "#1e7b3c", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Proposta aceita{p.aceitaEm ? ` em ${formatarDataISO(dataISONoBrasil(p.aceitaEm))}` : ""}. Seu treinamento já está na agenda.
        </p>
      )}
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <BotaoImprimir />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Typecheck and all tests**

Run: `bunx tsc --noEmit && bun test`
Expected: limpo; todos PASS.

- [ ] **Step 7: Commit**

```bash
git add auth.config.ts "app/parceiro365/proposta"
git commit -m "Propostas: página pública com chave de acesso, validade e aceite que cria o evento

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Migração, chave da SerpApi, checagem no navegador e PR

Feita pelo **agente principal junto com o Rafael**, sem subagente, porque mexe no banco real e em variáveis da Vercel.

- [ ] **Step 1: Ambiente local.** Confirme com o Rafael de onde vem o `DATABASE_URL` (o repo não tem `.env.local`). O caminho normal é `vercel env pull .env.local`. Pergunte também se há um branch de banco Neon de desenvolvimento. Se não houver, a migração vai direto no banco de produção. Ela é aditiva, só cria tabelas e um tipo, mas **peça confirmação explícita antes de aplicar.**
- [ ] **Step 2: Aplicar a migração.** Run: `bun run db:migrate`. Expected: `+ 0009_propostas.sql: N statement(s)` e `Migrations aplicadas: 1`.
- [ ] **Step 3: SerpApi.** Se o Rafael tiver a chave, ela vai no `.env.local` (`SERPAPI_API_KEY=...`, digitada por ele) e na Vercel, em Production e Preview. Sem chave, teste o caminho do valor manual e a mensagem "Busca de voos não configurada".
- [ ] **Step 4: Checagem no navegador** (`bun run dev`, login como super admin):
  - Propostas → Configurações: trocar o hotel para `400` e salvar. A nova proposta vem com 400,00. Depois voltar para 350.
  - Nova proposta: escolher um distribuidor (o aeroporto é sugerido), data daqui a 20 dias, duração 1, buscar voos (ou valor manual nas duas origens). O resumo bate com a fórmula.
  - Mudar a data limpa os voos buscados.
  - Gerar link: aparecem link, chave e validade de 10 dias. Copiar a mensagem de WhatsApp.
  - Janela anônima: o link pede a chave. Chave errada mostra "Chave incorreta". A certa mostra só o total e a validade.
  - Aceitar → confirmar: aparece "Proposta aceita". No admin, a lista mostra "Aceita · evento criado". Entrando na conta do distribuidor, o evento aparece em Treinamentos.
  - Aceitar de novo noutra aba: aparece "Esta proposta não pode mais ser aceita", e o segundo evento não é criado.
  - Expirada: para testar sem esperar 10 dias, coloque `validaAte` no passado de uma proposta de teste (`update proposals set valida_ate = now() - interval '1 day' where id = '…'`, com o OK do Rafael). O link mostra "Proposta expirada" e o editor oferece "Renovar e gerar link".
  - Cancelada: o link mostra "Proposta indisponível".
  - Celular (390px): a página pública não tem rolagem horizontal.
  - Apagar as propostas e o evento de teste no fim, com o OK do Rafael.
- [ ] **Step 5: Revisão final do branch** com o `superpowers:requesting-code-review`, e correção do que for confirmado.
- [ ] **Step 6: PR.** `git push -u origin feat/gerador-propostas` e `gh pr create` com o resumo e o checklist de teste. O corpo termina com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. O merge na `main` só acontece com o OK do Rafael.
