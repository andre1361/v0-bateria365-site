# Conversor de corrente de partida — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/corrente-de-partida` para o lojista converter a corrente de partida entre normas (base SAE) e receber um parecer de compatibilidade com margem tropical por UF.

**Architecture:** A regra fica em funções puras em `lib/corrente-partida/` (normas/conversão, código JIS, parecer), testadas com `bun test`. A página segue o padrão de `/codigo-radio`: server component noindex que lê o cookie assinado de região e mostra a trava (`RegiaoGate`, agora compartilhado em `components/`) ou o client component com as abas Converter e Comparar. Nada novo no servidor: a trava reaproveita o cookie e a rota existentes.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind, componentes `components/ui` (shadcn), lucide-react, `bun test` (sem dependência nova).

**Spec:** `docs/superpowers/specs/2026-10-03-conversor-corrente-partida-design.md`

## Global Constraints

- Todo texto de tela em português do Brasil; nomes de código em português, como no restante do repo (`paraSae`, `calcularParecer`, `RegiaoGate`).
- SAE é a base: toda conversão passa por SAE e SAE é a norma pré-selecionada.
- Fatores → SAE `[min, max]`: sae/nbr/jis `[1, 1]`, en `[1.04, 1.11]`, iec `[1.50, 1.58]`, din `[1.67, 1.82]`, ca `[0.77, 0.81]`.
- Valor válido: inteiro de 50 a 2000 A. Valores exibidos arredondados de 5 em 5 A.
- Parecer: regra exigente = diesel OU start-stop OU clima frio. Faixas: ≥1,00 compatível; regra normal 0,90–0,99 aceitável, 0,80–0,89 ressalva, <0,80 não recomendado; regra exigente <1,00 não recomendado. Razão comparada sem arredondar; porcentagem truncada.
- Normas diferentes: `razão = candidata.min (SAE) ÷ original.centro (SAE)`. Mesma norma: `candidata ÷ original`.
- Clima padrão pela UF do cookie: RS, SC, PR → frio; demais → tropical; o lojista pode trocar.
- Página noindex, mesma trava de região e mesmo cookie `codigo_radio_regiao` do `/codigo-radio` (sem renomear).
- Nenhuma dependência nova. Nada roda no servidor além da leitura do cookie.
- Rodapé: "Valores de referência. Na dúvida, vale a especificação da montadora."

## Review Focus

1. Lojista digita o valor como está na etiqueta ("600A", "600 A", "1.000") → deve aceitar e converter, não dar erro. Teste em Task 1.
2. Razões que caem exatamente na fronteira por conta de ponto flutuante (540 ÷ 600, 480 ÷ 600) → devem cair em "aceitável" (90%) e "ressalva" (80%), não na faixa de baixo. Teste em Task 3.
3. SAE contra NBR ou JIS (normas equivalentes) → não deve aparecer o aviso "normas diferentes" nem penalizar a candidata. Teste em Task 3.
4. Código JIS com sufixo, minúsculas ou hífen ("55b24-l", "55B24LS", "55B24LMF") → deve reconhecer. Teste em Task 2.
5. Trocar de aba (Converter ↔ Comparar) ou trocar a norma depois de digitar → o valor digitado continua lá e o resultado recalcula. Verificação no navegador em Task 6 (as abas ficam montadas, só escondidas).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `lib/corrente-partida/normas.ts` (novo) | Tabela `NORMAS`, `paraSae`, `deSae`, `converterTodas`, `arredondar5`, `validarValor` |
| `lib/corrente-partida/jis.ts` (novo) | `decodificarJis`, `CCA_JIS` |
| `lib/corrente-partida/parecer.ts` (novo) | `climaPorUf`, `calcularParecer`, `MOTIVOS`, `TITULOS` |
| `lib/corrente-partida/*.test.ts` (novos) | Testes `bun test` |
| `tsconfig.json` (alterar) | Excluir `**/*.test.ts` do type-check do Next (usa `bun:test`) |
| `components/regiao-gate.tsx` (movido de `app/codigo-radio/regiao-gate.tsx`) | Trava por localização com textos por props |
| `app/codigo-radio/page.tsx` (alterar) | Usa o `RegiaoGate` compartilhado com os textos atuais |
| `app/corrente-de-partida/page.tsx` (novo) | Metadata noindex/OG, leitura do cookie, gate ou cliente |
| `app/corrente-de-partida/conversor-client.tsx` (novo) | Abas Converter e Comparar |
| `app/corrente-de-partida/opengraph-image.tsx` (novo) | Prévia do link |
| `next.config.mjs` (alterar) | Inclui fonte/logo no deploy da nova imagem OG |

---

### Task 1: Normas e conversão

**Files:**
- Create: `lib/corrente-partida/normas.ts`
- Create: `lib/corrente-partida/normas.test.ts`
- Modify: `tsconfig.json` (campo `exclude`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type NormaId = "sae" | "nbr" | "jis" | "en" | "iec" | "din" | "ca"`
  - `type Norma = { id: NormaId; sigla: string; rotulo: string; ensaio: string; fator: { min: number; max: number }; nota?: string }`
  - `type Faixa = { min: number; max: number; centro: number }`
  - `NORMAS: Norma[]` (SAE primeiro), `NORMA_PADRAO: NormaId`, `VALOR_MIN = 50`, `VALOR_MAX = 2000`
  - `norma(id: NormaId): Norma`
  - `paraSae(valor: number, id: NormaId): Faixa`
  - `deSae(sae: Faixa, id: NormaId): Faixa`
  - `converterTodas(valor: number, id: NormaId): { norma: Norma; faixa: Faixa }[]`
  - `arredondar5(n: number): number`
  - `validarValor(texto: string): { ok: true; valor: number } | { ok: false; erro: string }` (`erro: ""` quando vazio)

- [ ] **Step 1: Write the failing test**

`lib/corrente-partida/normas.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { NORMAS, arredondar5, converterTodas, deSae, paraSae, validarValor } from "./normas"

describe("paraSae / deSae", () => {
  test("SAE para SAE é identidade", () => {
    expect(paraSae(500, "sae")).toEqual({ min: 500, max: 500, centro: 500 })
  })

  test("EN 600 vira SAE 624–666", () => {
    const f = paraSae(600, "en")
    expect(f.min).toBeCloseTo(624)
    expect(f.max).toBeCloseTo(666)
    expect(f.centro).toBeCloseTo(645)
  })

  test("DIN 300 vira SAE 501–546", () => {
    const f = paraSae(300, "din")
    expect(f.min).toBeCloseTo(501)
    expect(f.max).toBeCloseTo(546)
  })

  test("ida e volta SAE → EN → SAE contém o valor original", () => {
    const en = deSae(paraSae(600, "sae"), "en")
    const volta = paraSae(en.centro, "en")
    expect(volta.min).toBeLessThanOrEqual(600)
    expect(volta.max).toBeGreaterThanOrEqual(600)
  })
})

describe("converterTodas", () => {
  test("lista todas as normas com SAE primeiro e a de entrada exata", () => {
    const linhas = converterTodas(600, "en")
    expect(linhas.map((l) => l.norma.id)).toEqual(NORMAS.map((n) => n.id))
    expect(linhas[0].norma.id).toBe("sae")
    expect(linhas.find((l) => l.norma.id === "en")!.faixa).toEqual({ min: 600, max: 600, centro: 600 })
  })

  test("NBR e JIS saem iguais à SAE", () => {
    const linhas = converterTodas(600, "en")
    const sae = linhas.find((l) => l.norma.id === "sae")!.faixa
    expect(linhas.find((l) => l.norma.id === "nbr")!.faixa).toEqual(sae)
    expect(linhas.find((l) => l.norma.id === "jis")!.faixa).toEqual(sae)
  })

  test("SAE 600 para NBR é exato", () => {
    expect(converterTodas(600, "sae").find((l) => l.norma.id === "nbr")!.faixa).toEqual({ min: 600, max: 600, centro: 600 })
  })
})

test("arredondar5", () => {
  expect(arredondar5(641)).toBe(640)
  expect(arredondar5(643)).toBe(645)
  expect(arredondar5(642.5)).toBe(645)
})

describe("validarValor", () => {
  test.each([
    ["600", 600],
    [" 600 A", 600],
    ["600a", 600],
    ["1.000", 1000],
    ["50", 50],
    ["2000", 2000],
  ])("aceita %p", (texto, valor) => {
    expect(validarValor(texto)).toEqual({ ok: true, valor })
  })

  test("vazio não mostra erro", () => {
    expect(validarValor("  ")).toEqual({ ok: false, erro: "" })
  })

  test.each(["abc", "12,5", "-5"])("rejeita %p", (texto) => {
    expect(validarValor(texto)).toEqual({ ok: false, erro: "Use só números, ex.: 500." })
  })

  test.each(["45", "2001"])("fora da faixa %p", (texto) => {
    expect(validarValor(texto)).toEqual({ ok: false, erro: "Informe um valor entre 50 e 2000 A." })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/corrente-partida/normas.test.ts`
Expected: FAIL — `Cannot find module './normas'`.

- [ ] **Step 3: Write minimal implementation**

`lib/corrente-partida/normas.ts`:

```ts
// Normas de corrente de partida a frio e conversão entre elas, sempre passando pela SAE.
// Nenhum fabricante publica fator oficial: cada norma tem uma faixa [min, max] tirada das tabelas
// de mercado (CTEK, Varta, Shield). Fontes na spec docs/superpowers/specs/2026-10-03-conversor-corrente-partida-design.md.

export type NormaId = "sae" | "nbr" | "jis" | "en" | "iec" | "din" | "ca"

export type Norma = {
  id: NormaId
  sigla: string // rótulo curto dos botões
  rotulo: string // nome completo na lista de resultados
  ensaio: string
  fator: { min: number; max: number } // multiplica o valor da norma para obter SAE
  nota?: string // aviso mostrado quando a norma é escolhida
}

export type Faixa = { min: number; max: number; centro: number }

export const NORMA_PADRAO: NormaId = "sae"
export const VALOR_MIN = 50
export const VALOR_MAX = 2000

export const NORMAS: Norma[] = [
  { id: "sae", sigla: "SAE", rotulo: "SAE J537 (CCA)", ensaio: "−18 °C, 30 s, ≥7,2 V", fator: { min: 1, max: 1 } },
  { id: "nbr", sigla: "NBR", rotulo: "NBR 15940 (Brasil / Inmetro)", ensaio: "Igual à SAE", fator: { min: 1, max: 1 } },
  { id: "jis", sigla: "JIS", rotulo: "JIS D 5301 (CCA)", ensaio: "Igual à SAE (JIS de 2006 em diante)", fator: { min: 1, max: 1 } },
  { id: "en", sigla: "EN", rotulo: "EN 50342-1", ensaio: "−18 °C, 10 s ≥7,5 V + 73 s", fator: { min: 1.04, max: 1.11 } },
  {
    id: "iec",
    sigla: "IEC",
    rotulo: "IEC 60095 (antiga, 60 s)",
    ensaio: "−18 °C, 60 s, 8,4 V",
    fator: { min: 1.5, max: 1.58 },
    nota: "IEC de 2006 em diante já equivale à EN: se a etiqueta trouxer IEC com ano 2006 ou depois, use EN.",
  },
  {
    id: "din",
    sigla: "DIN",
    rotulo: "DIN 43539 / 72311",
    ensaio: "−18 °C, ≥9 V aos 30 s",
    fator: { min: 1.67, max: 1.82 },
    nota: "DIN vale cerca de 60% do EN: não confunda as duas.",
  },
  {
    id: "ca",
    sigla: "CA/MCA",
    rotulo: "CA / MCA (0 °C)",
    ensaio: "0 °C, 30 s, 7,2 V",
    fator: { min: 0.77, max: 0.81 },
    nota: "Medida a 0 °C, por isso o número é maior que a CCA.",
  },
]

export function norma(id: NormaId): Norma {
  const n = NORMAS.find((x) => x.id === id)
  if (!n) throw new Error(`Norma desconhecida: ${id}`)
  return n
}

const media = (f: Norma["fator"]) => (f.min + f.max) / 2

export function paraSae(valor: number, id: NormaId): Faixa {
  const { fator } = norma(id)
  return { min: valor * fator.min, max: valor * fator.max, centro: valor * media(fator) }
}

export function deSae(sae: Faixa, id: NormaId): Faixa {
  const { fator } = norma(id)
  return { min: sae.min / fator.max, max: sae.max / fator.min, centro: sae.centro / media(fator) }
}

// Valor de entrada convertido para todas as normas, na ordem de NORMAS (SAE primeiro). A norma de entrada sai exata.
export function converterTodas(valor: number, id: NormaId): { norma: Norma; faixa: Faixa }[] {
  const sae = paraSae(valor, id)
  return NORMAS.map((n) => ({ norma: n, faixa: n.id === id ? { min: valor, max: valor, centro: valor } : deSae(sae, n.id) }))
}

export const arredondar5 = (n: number) => Math.round(n / 5) * 5

// Aceita o valor como vem na etiqueta: "600", "600 A", "1.000".
export function validarValor(texto: string): { ok: true; valor: number } | { ok: false; erro: string } {
  let t = texto.replace(/\s/g, "").replace(/a$/i, "")
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "")
  if (t === "") return { ok: false, erro: "" }
  if (!/^\d+$/.test(t)) return { ok: false, erro: "Use só números, ex.: 500." }
  const valor = Number(t)
  if (valor < VALOR_MIN || valor > VALOR_MAX) return { ok: false, erro: `Informe um valor entre ${VALOR_MIN} e ${VALOR_MAX} A.` }
  return { ok: true, valor }
}
```

Em `tsconfig.json`, trocar:

```json
  "exclude": ["node_modules"]
```

por:

```json
  "exclude": ["node_modules", "**/*.test.ts"]
```

(os testes importam `bun:test`, que o type-check do Next não conhece).

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/corrente-partida/normas.test.ts`
Expected: PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add lib/corrente-partida/normas.ts lib/corrente-partida/normas.test.ts tsconfig.json
git commit -m "Corrente de partida: tabela de normas e conversão via SAE"
```

---

### Task 2: Código JIS

**Files:**
- Create: `lib/corrente-partida/jis.ts`
- Create: `lib/corrente-partida/jis.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type JisDecodificado = { codigo: string; classe: number; caixa: string; larguraMm: number | null; comprimentoCm: number; polo: "L" | "R" | null; cca: number | null }`
  - `CCA_JIS: Record<string, number>` (chave sem polo, ex.: `"55B24"`)
  - `decodificarJis(texto: string): JisDecodificado | null`

- [ ] **Step 1: Write the failing test**

`lib/corrente-partida/jis.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { decodificarJis } from "./jis"

describe("decodificarJis", () => {
  test("55B24L", () => {
    expect(decodificarJis("55B24L")).toEqual({ codigo: "55B24L", classe: 55, caixa: "B", larguraMm: 127, comprimentoCm: 24, polo: "L", cca: 370 })
  })

  test.each(["55b24-l", " 55 B24 L ", "55B24LS", "55B24LMF"])("normaliza %p", (texto) => {
    const d = decodificarJis(texto)
    expect(d?.codigo).toBe("55B24L")
    expect(d?.cca).toBe(370)
  })

  test("80D26R", () => {
    const d = decodificarJis("80D26R")!
    expect(d.polo).toBe("R")
    expect(d.larguraMm).toBe(173)
    expect(d.cca).toBe(490)
  })

  test("95D31 sem polo", () => {
    const d = decodificarJis("95D31")!
    expect(d.polo).toBeNull()
    expect(d.cca).toBe(565)
  })

  test("105D31L com classe de 3 dígitos", () => {
    expect(decodificarJis("105D31L")?.cca).toBe(655)
  })

  test("código válido fora da tabela não tem CCA", () => {
    const d = decodificarJis("40B20L")!
    expect(d.classe).toBe(40)
    expect(d.cca).toBeNull()
  })

  test.each(["XYZ", "", "55Z24L", "5B24L", "55B2L"])("inválido %p", (texto) => {
    expect(decodificarJis(texto)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/corrente-partida/jis.test.ts`
Expected: FAIL — `Cannot find module './jis'`.

- [ ] **Step 3: Write minimal implementation**

`lib/corrente-partida/jis.ts`:

```ts
// Código de bateria JIS (ex.: 55B24L): classe de desempenho, caixa, comprimento e lado do polo negativo.
// A classe NÃO é ampère (mistura CCA e capacidade de reserva); a CCA vem de uma tabela de referência.

export type JisDecodificado = {
  codigo: string // normalizado, ex.: "55B24L"
  classe: number
  caixa: string
  larguraMm: number | null
  comprimentoCm: number
  polo: "L" | "R" | null
  cca: number | null
}

// CCA típica (catálogos GS Yuasa e listas japonesas). A etiqueta sempre prevalece.
export const CCA_JIS: Record<string, number> = {
  "34B19": 240,
  "38B19": 265,
  "46B24": 295,
  "55B24": 370,
  "60B24": 405,
  "55D23": 320,
  "75D23": 465,
  "80D23": 500,
  "80D26": 490,
  "95D31": 565,
  "105D31": 655,
  "115D31": 735,
}

const LARGURA_MM: Record<string, number> = { B: 127, D: 173 }

export function decodificarJis(texto: string): JisDecodificado | null {
  const limpo = texto.toUpperCase().replace(/[\s-]/g, "").replace(/(MF|S)$/, "")
  const m = /^(\d{2,3})([A-H])(\d{2})(L|R)?$/.exec(limpo)
  if (!m) return null
  const [, classe, caixa, comprimento, polo] = m
  return {
    codigo: limpo,
    classe: Number(classe),
    caixa,
    larguraMm: LARGURA_MM[caixa] ?? null,
    comprimentoCm: Number(comprimento),
    polo: (polo as "L" | "R" | undefined) ?? null,
    cca: CCA_JIS[`${classe}${caixa}${comprimento}`] ?? null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/corrente-partida/jis.test.ts`
Expected: PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add lib/corrente-partida/jis.ts lib/corrente-partida/jis.test.ts
git commit -m "Corrente de partida: decodificação do código JIS e CCA de referência"
```

---

### Task 3: Parecer de compatibilidade

**Files:**
- Create: `lib/corrente-partida/parecer.ts`
- Create: `lib/corrente-partida/parecer.test.ts`

**Interfaces:**
- Consumes: `paraSae(valor, id): Faixa` e `type NormaId` de `./normas` (Task 1).
- Produces:
  - `type Veiculo = "flex" | "diesel" | "start-stop"`
  - `type Clima = "tropical" | "frio"`
  - `type Nivel = "compativel" | "aceitavel" | "ressalva" | "nao-recomendado"`
  - `type BateriaInformada = { valor: number; norma: NormaId }`
  - `type Parecer = { nivel: Nivel; razao: number; porcentagem: number; saeOriginal: number; saeCandidata: number; titulo: string; explicacao: string; motivos: string[] }`
  - `UFS_FRIAS: string[]`, `TITULOS: Record<Nivel, string>`, `MOTIVOS` (objeto com `muitoAbaixo`, `diesel`, `startStop`, `frio`, `tecnologia`, `normas`)
  - `climaPorUf(uf: string | null | undefined): Clima`
  - `calcularParecer(e: { original: BateriaInformada; candidata: BateriaInformada; veiculo: Veiculo; clima: Clima }): Parecer`

- [ ] **Step 1: Write the failing test**

`lib/corrente-partida/parecer.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import type { NormaId } from "./normas"
import { MOTIVOS, calcularParecer, climaPorUf, type Clima, type Veiculo } from "./parecer"

const bat = (valor: number, norma: NormaId = "sae") => ({ valor, norma })
const parecer = (original: number, candidata: number, veiculo: Veiculo = "flex", clima: Clima = "tropical") =>
  calcularParecer({ original: bat(original), candidata: bat(candidata), veiculo, clima })

describe("flex em clima tropical", () => {
  test.each([
    [500, "compativel", 100],
    [600, "compativel", 120],
    [450, "aceitavel", 90],
    [445, "ressalva", 89],
    [400, "ressalva", 80],
    [395, "nao-recomendado", 79],
  ])("original 500, candidata %p → %p", (candidata, nivel, porcentagem) => {
    const p = parecer(500, candidata as number)
    expect(p.nivel).toBe(nivel as string)
    expect(p.porcentagem).toBe(porcentagem as number)
  })

  test("mais de 20% abaixo explica o motivo", () => {
    expect(parecer(500, 395).motivos).toContain(MOTIVOS.muitoAbaixo)
  })

  test("fronteiras com ponto flutuante não caem para a faixa de baixo", () => {
    expect(parecer(600, 540)).toMatchObject({ nivel: "aceitavel", porcentagem: 90 })
    expect(parecer(600, 480)).toMatchObject({ nivel: "ressalva", porcentagem: 80 })
  })

  test("0,899 é ressalva e mostra 89%, não 90%", () => {
    expect(parecer(1000, 899)).toMatchObject({ nivel: "ressalva", porcentagem: 89 })
  })
})

describe("regra exigente", () => {
  test("diesel: igual passa, abaixo não", () => {
    expect(parecer(500, 500, "diesel").nivel).toBe("compativel")
    const p = parecer(500, 499, "diesel")
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.diesel)
  })

  test("start-stop sempre avisa sobre a tecnologia", () => {
    const ok = parecer(500, 520, "start-stop")
    expect(ok.nivel).toBe("compativel")
    expect(ok.motivos).toContain(MOTIVOS.tecnologia)
    const ruim = parecer(500, 450, "start-stop")
    expect(ruim.nivel).toBe("nao-recomendado")
    expect(ruim.motivos).toContain(MOTIVOS.startStop)
    expect(ruim.motivos).toContain(MOTIVOS.tecnologia)
  })

  test("clima frio: 90% não é recomendado", () => {
    const p = parecer(500, 450, "flex", "frio")
    expect(p.nivel).toBe("nao-recomendado")
    expect(p.motivos).toContain(MOTIVOS.frio)
  })
})

describe("normas", () => {
  test("normas diferentes usam o menor valor provável da candidata", () => {
    // EN 560 → SAE 582,4 a 621,6 (centro 602); com o mínimo fica 97% de 600
    const p = calcularParecer({ original: bat(600), candidata: bat(560, "en"), veiculo: "flex", clima: "tropical" })
    expect(p.nivel).toBe("aceitavel")
    expect(p.saeCandidata).toBeCloseTo(582.4)
    expect(p.saeOriginal).toBe(600)
    expect(p.motivos).toContain(MOTIVOS.normas)
  })

  test("mesma norma compara direto", () => {
    const p = calcularParecer({ original: bat(600, "en"), candidata: bat(600, "en"), veiculo: "flex", clima: "tropical" })
    expect(p.nivel).toBe("compativel")
    expect(p.razao).toBe(1)
    expect(p.motivos).not.toContain(MOTIVOS.normas)
  })

  test("SAE contra NBR não penaliza nem avisa", () => {
    const p = calcularParecer({ original: bat(500), candidata: bat(500, "nbr"), veiculo: "flex", clima: "tropical" })
    expect(p.nivel).toBe("compativel")
    expect(p.motivos).not.toContain(MOTIVOS.normas)
  })
})

describe("climaPorUf", () => {
  test.each(["RS", "SC", "PR", "rs"])("%p é frio", (uf) => expect(climaPorUf(uf)).toBe("frio"))
  test.each(["SP", "AM", "MG", null, undefined])("%p é tropical", (uf) => expect(climaPorUf(uf)).toBe("tropical"))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/corrente-partida/parecer.test.ts`
Expected: FAIL — `Cannot find module './parecer'`.

- [ ] **Step 3: Write minimal implementation**

`lib/corrente-partida/parecer.ts`:

```ts
import { paraSae, type NormaId } from "./normas"

// Parecer "essa bateria serve no lugar da original?" com margem para clima tropical.
// As faixas são inferência da Bateria 365 a partir das fontes da spec, não norma publicada:
// fora do Sul a bateria entrega mais e o motor pede menos, mas a conversão entre normas tem
// incerteza de ±10% e a bateria perde CCA com o uso.

export type Veiculo = "flex" | "diesel" | "start-stop"
export type Clima = "tropical" | "frio"
export type Nivel = "compativel" | "aceitavel" | "ressalva" | "nao-recomendado"
export type BateriaInformada = { valor: number; norma: NormaId }

export type Parecer = {
  nivel: Nivel
  razao: number // candidata ÷ original, em SAE
  porcentagem: number // truncada: 0,899 → 89
  saeOriginal: number
  saeCandidata: number
  titulo: string
  explicacao: string
  motivos: string[]
}

export const UFS_FRIAS = ["RS", "SC", "PR"]

export const TITULOS: Record<Nivel, string> = {
  compativel: "Compatível",
  aceitavel: "Aceitável",
  ressalva: "Só com ressalva",
  "nao-recomendado": "Não recomendado",
}

const EXPLICACOES: Record<Nivel, string> = {
  compativel: "A bateria tem corrente de partida igual ou maior que a original. Pode instalar: corrente maior não prejudica o carro.",
  aceitavel:
    "Até 10% abaixo da original: dentro da diferença entre as normas. Em clima quente a bateria entrega mais corrente e o motor pede menos para girar.",
  ressalva:
    "Entre 10% e 20% abaixo da original. Só para carro flex/gasolina com bateria convencional, fora do Sul e das serras, e com sistema elétrico original. Avise o cliente.",
  "nao-recomendado": "A bateria não atende à corrente de partida que o veículo precisa.",
}

export const MOTIVOS = {
  muitoAbaixo: "Está mais de 20% abaixo da original.",
  diesel: "Motor diesel exige corrente de partida igual ou maior que a original.",
  startStop: "Start-stop exige corrente de partida igual ou maior que a original.",
  frio: "Em região fria (Sul e serras) use corrente de partida igual ou maior que a original.",
  tecnologia: "Start-stop exige a mesma tecnologia da original: EFB por EFB (ou AGM), AGM só por AGM.",
  normas: "Normas diferentes: usamos o menor valor provável da bateria que você tem, para não superestimá-la.",
}

// Folga para divisões como 540 ÷ 600 não caírem abaixo de 0,9 por ponto flutuante.
const EPS = 1e-9

export function climaPorUf(uf: string | null | undefined): Clima {
  return uf && UFS_FRIAS.includes(uf.toUpperCase()) ? "frio" : "tropical"
}

export function calcularParecer({
  original,
  candidata,
  veiculo,
  clima,
}: {
  original: BateriaInformada
  candidata: BateriaInformada
  veiculo: Veiculo
  clima: Clima
}): Parecer {
  const mesmaNorma = original.norma === candidata.norma
  const saeOriginal = paraSae(original.valor, original.norma).centro
  const faixaCandidata = paraSae(candidata.valor, candidata.norma)
  // Normas diferentes: a incerteza da conversão nunca favorece a candidata.
  const pessimista = !mesmaNorma && faixaCandidata.min < faixaCandidata.centro
  const saeCandidata = pessimista ? faixaCandidata.min : faixaCandidata.centro
  const razao = mesmaNorma ? candidata.valor / original.valor : saeCandidata / saeOriginal
  const r = razao + EPS

  const exigente = veiculo !== "flex" || clima === "frio"
  let nivel: Nivel
  if (r >= 1) nivel = "compativel"
  else if (exigente) nivel = "nao-recomendado"
  else if (r >= 0.9) nivel = "aceitavel"
  else if (r >= 0.8) nivel = "ressalva"
  else nivel = "nao-recomendado"

  const motivos: string[] = []
  if (nivel === "nao-recomendado") {
    if (veiculo === "diesel") motivos.push(MOTIVOS.diesel)
    if (veiculo === "start-stop") motivos.push(MOTIVOS.startStop)
    if (clima === "frio") motivos.push(MOTIVOS.frio)
    if (r < 0.8) motivos.push(MOTIVOS.muitoAbaixo)
  }
  if (veiculo === "start-stop") motivos.push(MOTIVOS.tecnologia)
  if (pessimista) motivos.push(MOTIVOS.normas)

  return {
    nivel,
    razao,
    porcentagem: Math.floor(r * 100),
    saeOriginal,
    saeCandidata,
    titulo: TITULOS[nivel],
    explicacao: EXPLICACOES[nivel],
    motivos,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/corrente-partida`
Expected: PASS em `normas`, `jis` e `parecer`, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add lib/corrente-partida/parecer.ts lib/corrente-partida/parecer.test.ts
git commit -m "Corrente de partida: parecer de compatibilidade com margem tropical"
```

---

### Task 4: Trava de região compartilhada

**Files:**
- Move: `app/codigo-radio/regiao-gate.tsx` → `components/regiao-gate.tsx`
- Modify: `components/regiao-gate.tsx` (textos por props)
- Modify: `app/codigo-radio/page.tsx`

**Interfaces:**
- Consumes: rota existente `POST /api/codigo-radio/regiao` (sem mudança).
- Produces: `RegiaoGate({ titulo, subtitulo, descricao }: { titulo: string; subtitulo: string; descricao: string })` em `@/components/regiao-gate`.

- [ ] **Step 1: Mover o arquivo**

```bash
git mv app/codigo-radio/regiao-gate.tsx components/regiao-gate.tsx
```

- [ ] **Step 2: Textos por props**

Em `components/regiao-gate.tsx`, trocar:

```tsx
// Pede a localização do aparelho e libera a consulta se a UF estiver na lista do servidor.
export function RegiaoGate() {
```

por:

```tsx
type Props = {
  titulo: string
  subtitulo: string
  descricao: string // por que a localização é pedida
}

// Pede a localização do aparelho e libera a ferramenta se a UF estiver na lista do servidor.
// O cookie de região vale para todas as ferramentas (código do rádio, corrente de partida).
export function RegiaoGate({ titulo, subtitulo, descricao }: Props) {
```

Trocar:

```tsx
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">Código do rádio</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">Recupere o código de desbloqueio do rádio.</p>
```

por:

```tsx
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">{titulo}</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">{subtitulo}</p>
```

Trocar:

```tsx
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5a6579]">
            A consulta é liberada apenas para as regiões que já receberam o Bateria 365. Permita o acesso à localização para continuar.
          </p>
```

por:

```tsx
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5a6579]">{descricao}</p>
```

Trocar `Sem a localização não conseguimos liberar a consulta.` por `Sem a localização não conseguimos liberar o acesso.`

- [ ] **Step 3: Usar no código do rádio com os textos atuais**

Em `app/codigo-radio/page.tsx`, trocar:

```tsx
import { RegiaoGate } from "./regiao-gate"
```

por:

```tsx
import { RegiaoGate } from "@/components/regiao-gate"
```

e trocar:

```tsx
  return liberado ? <ConsultaClient /> : <RegiaoGate />
```

por:

```tsx
  return liberado ? (
    <ConsultaClient />
  ) : (
    <RegiaoGate
      titulo="Código do rádio"
      subtitulo="Recupere o código de desbloqueio do rádio."
      descricao="A consulta é liberada apenas para as regiões que já receberam o Bateria 365. Permita o acesso à localização para continuar."
    />
  )
```

- [ ] **Step 4: Verificar que nada mais importa o caminho antigo**

Run: `grep -rn "regiao-gate" app components lib`
Expected: só `app/codigo-radio/page.tsx` importando `@/components/regiao-gate`.

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "regiao-gate|codigo-radio/page" || echo OK`
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add components/regiao-gate.tsx app/codigo-radio/page.tsx
git commit -m "Trava de região vira componente compartilhado entre as ferramentas"
```

---

### Task 5: Página /corrente-de-partida

**Files:**
- Create: `app/corrente-de-partida/page.tsx`
- Create: `app/corrente-de-partida/conversor-client.tsx`
- Create: `app/corrente-de-partida/opengraph-image.tsx`
- Modify: `next.config.mjs` (`outputFileTracingIncludes`)

**Interfaces:**
- Consumes: Task 1 (`NORMAS`, `NORMA_PADRAO`, `norma`, `converterTodas`, `arredondar5`, `validarValor`, `NormaId`), Task 2 (`decodificarJis`, `JisDecodificado`), Task 3 (`calcularParecer`, `climaPorUf`, `Clima`, `Nivel`, `Parecer`, `Veiculo`), Task 4 (`RegiaoGate`), `ufLiberadaDoToken`/`REGIAO_COOKIE` de `@/lib/radio-code/regiao`, `ogCard` de `@/lib/og/card`.
- Produces: rota `/corrente-de-partida` e `/corrente-de-partida/opengraph-image`; `ConversorClient({ uf }: { uf: string })`.

- [ ] **Step 1: Página (server)**

`app/corrente-de-partida/page.tsx`:

```tsx
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { RegiaoGate } from "@/components/regiao-gate"
import { REGIAO_COOKIE, ufLiberadaDoToken } from "@/lib/radio-code/regiao"
import { ConversorClient } from "./conversor-client"

const TITULO = "Corrente de partida"
const DESCRICAO = "Converta a corrente de partida entre SAE, EN, DIN, IEC, JIS e NBR e confira se a bateria serve no veículo."

// Título, descrição e imagem próprios para a pré-visualização do link (a imagem vem de opengraph-image.tsx).
export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: { title: TITULO, description: DESCRICAO, url: "/corrente-de-partida", siteName: "Bateria 365", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: ["/corrente-de-partida/opengraph-image"] },
  // Ferramenta interna: não deve ser indexada pelos buscadores.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function CorrenteDePartidaPage() {
  // Mesma trava do código do rádio: só regiões que já receberam o Bateria 365. A UF também define o clima do parecer.
  const uf = ufLiberadaDoToken((await cookies()).get(REGIAO_COOKIE)?.value)
  return uf ? (
    <ConversorClient uf={uf} />
  ) : (
    <RegiaoGate
      titulo={TITULO}
      subtitulo="Converta entre normas e confira se a bateria serve."
      descricao="A ferramenta é liberada apenas para as regiões que já receberam o Bateria 365. Permita o acesso à localização para continuar."
    />
  )
}
```

- [ ] **Step 2: Imagem de pré-visualização**

`app/corrente-de-partida/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/card"

export const alt = "Corrente de partida — Bateria 365"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    titulo: "Corrente de partida",
    descricao: "Converta a corrente de partida entre SAE, EN, DIN, IEC, JIS e NBR e confira se a bateria serve no veículo.",
    rodape: "bateria365.com.br/corrente-de-partida",
  })
}
```

Em `next.config.mjs`, dentro de `outputFileTracingIncludes`, adicionar a linha abaixo logo após a de `/codigo-radio/opengraph-image`:

```js
    "/corrente-de-partida/opengraph-image": ["./lib/og/*.ttf", "./public/images/logo-bateria365-*.png"],
```

- [ ] **Step 3: Cliente com as abas**

`app/corrente-de-partida/conversor-client.tsx`:

```tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NORMAS, NORMA_PADRAO, arredondar5, converterTodas, norma as buscarNorma, validarValor, type NormaId } from "@/lib/corrente-partida/normas"
import { decodificarJis, type JisDecodificado } from "@/lib/corrente-partida/jis"
import { calcularParecer, climaPorUf, type Clima, type Nivel, type Parecer, type Veiculo } from "@/lib/corrente-partida/parecer"

type Aba = "converter" | "comparar"
type Bateria = { norma: NormaId; texto: string; codigoJis: string }

const BATERIA_VAZIA: Bateria = { norma: NORMA_PADRAO, texto: "", codigoJis: "" }

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

const chip = (on: boolean) =>
  `h-8 rounded-full px-3.5 text-[13px] font-bold transition-colors ${on ? "bg-primary text-white" : "border border-[#d9e0ea] bg-white text-[#41506a] hover:bg-[#f1f4f9]"}`

export function ConversorClient({ uf }: { uf: string }) {
  const [aba, setAba] = useState<Aba>("converter")

  return (
    <main className="min-h-screen bg-[#eef2f8] px-4 py-6 font-sans text-[#16202f] sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 text-center">
          <Image src="/images/logo-bateria365-claro.png" alt="Bateria 365" width={140} height={27} className="mx-auto mb-3 h-7 w-auto" priority />
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">Corrente de partida</h1>
          <p className="mt-1 text-[14px] text-[#5a6579]">Converta entre normas e confira se a bateria serve.</p>
        </header>

        <div role="tablist" aria-label="Ferramenta" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-[#e4eaf3] p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`h-9 rounded-lg text-[14px] font-bold transition-colors ${aba === a.id ? "bg-white text-primary shadow-sm" : "text-[#5a6579]"}`}
            >
              {a.nome}
            </button>
          ))}
        </div>

        {/* As duas abas ficam montadas para não perder o que foi digitado ao trocar. */}
        <div hidden={aba !== "converter"}>
          <Converter />
        </div>
        <div hidden={aba !== "comparar"}>
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
                      {entrada ? "" : "≈ "}
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
        <div className="space-y-1.5">
          <Label className={ROTULO}>Tipo de veículo</Label>
          <div role="radiogroup" aria-label="Tipo de veículo" className="flex flex-wrap gap-1.5">
            {VEICULOS.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={o.id === veiculo} onClick={() => setVeiculo(o.id)} className={chip(o.id === veiculo)}>
                {o.nome}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className={ROTULO}>Clima onde o carro roda</Label>
          <div role="radiogroup" aria-label="Clima" className="flex flex-wrap gap-1.5">
            {CLIMAS.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={o.id === clima} onClick={() => setClima(o.id)} className={chip(o.id === clima)}>
                {o.nome}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1 text-[11.5px] leading-snug text-[#7b8597]">
            <MapPin className="h-3 w-3 shrink-0" /> Você está em {uf}: sugerimos {climaDaUf === "frio" ? "Sul / serra (frio)" : "clima quente"}. Troque se o carro roda em serra.
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

function CampoBateria({ id, titulo, bateria, onChange }: { id: string; titulo?: string; bateria: Bateria; onChange: (b: Bateria) => void }) {
  const normaAtual = buscarNorma(bateria.norma)
  const validacao = validarValor(bateria.texto)
  const temCodigo = bateria.norma === "jis" && bateria.codigoJis.trim() !== ""
  const jis = temCodigo ? decodificarJis(bateria.codigoJis) : null

  // Código JIS conhecido preenche a CCA de referência; o lojista pode corrigir com o valor da etiqueta.
  function trocarCodigo(codigoJis: string) {
    const d = decodificarJis(codigoJis)
    onChange({ ...bateria, codigoJis, texto: d?.cca ? String(d.cca) : bateria.texto })
  }

  return (
    <div className="space-y-3.5">
      {titulo && <h2 className="text-[15px] font-extrabold">{titulo}</h2>}

      <div className="space-y-1.5">
        <Label className={ROTULO}>Norma da etiqueta</Label>
        <div role="radiogroup" aria-label={titulo ? `Norma: ${titulo}` : "Norma da etiqueta"} className="flex flex-wrap gap-1.5">
          {NORMAS.map((n) => (
            <button key={n.id} type="button" role="radio" aria-checked={n.id === bateria.norma} onClick={() => onChange({ ...bateria, norma: n.id })} className={chip(n.id === bateria.norma)}>
              {n.sigla}
            </button>
          ))}
        </div>
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
            onChange={(e) => onChange({ ...bateria, texto: e.target.value })}
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
        da corrente da original · {arredondar5(parecer.saeCandidata)} A contra {arredondar5(parecer.saeOriginal)} A (em SAE)
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
        <p>Tudo é convertido para SAE (CCA a −18 °C). NBR e JIS usam o mesmo ensaio da SAE. Para EN, IEC, DIN e CA/MCA não existe fator oficial: mostramos a faixa das tabelas de mercado.</p>
        <p>
          A 0 °C a bateria entrega cerca de 25% mais corrente que a −18 °C, e o motor pede menos para girar. Por isso, em clima quente, aceitamos até 10% abaixo da original e, com ressalva, até 20%. Diesel, start-stop e regiões frias (Sul e serras) pedem corrente igual ou maior que a original, como recomenda a Moura.
        </p>
        <p>Não convertemos EN antiga (anterior a 2006) nem JIS de 1999: elas não geram uma CCA comparável.</p>
      </div>
    </details>
  )
}
```

- [ ] **Step 4: Type-check e testes**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "corrente-de-partida|corrente-partida|regiao-gate" || echo OK`
Expected: `OK`.

Run: `bun test lib/corrente-partida`
Expected: PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add app/corrente-de-partida next.config.mjs
git commit -m "Página /corrente-de-partida: abas Converter e Comparar com trava de região"
```

---

### Task 6: Verificação no navegador

**Files:** nenhum (só verificação; corrigir no arquivo da task correspondente se algo falhar).

- [ ] **Step 1: Subir o servidor e gerar o cookie de região**

Run (em background): `bun run dev`

Run: `bun -e 'import { criarTokenRegiao } from "./lib/radio-code/regiao"; console.log(criarTokenRegiao("SP"), criarTokenRegiao("RS"))'`
Guarda os dois tokens (o Bun carrega o mesmo `.env`/`.env.local` do Next, então a assinatura bate).

- [ ] **Step 2: Trava**

Sem cookie, abrir `http://localhost:3000/corrente-de-partida` e `http://localhost:3000/codigo-radio`.
Expected: as duas mostram "Confirme sua região" com seus próprios títulos; o `/codigo-radio` com o texto "A consulta é liberada…".

Definir o cookie no navegador: `document.cookie = "codigo_radio_regiao=<token SP>; path=/"` e recarregar as duas.
Expected: `/codigo-radio` mostra a consulta; `/corrente-de-partida` mostra as abas.

- [ ] **Step 3: Converter**

- `600` em SAE → SAE 600 destacado, NBR 600, JIS 600, EN ≈ 560 (faixa 540–575), DIN ≈ 345 (faixa 330–360), sem erro.
- Digitar `600 A` e `1.000` → aceita. Digitar `45` → "Informe um valor entre 50 e 2000 A.".
- Com o valor digitado, trocar a norma para EN → o valor continua e a lista recalcula (SAE ≈ 645, faixa 625–665).
- Escolher JIS e digitar `55b24-l` → mostra decodificação e preenche 370. Digitar `XYZ` → "Código JIS não reconhecido".
- Escolher DIN e IEC → aparece a nota de cada uma.

- [ ] **Step 4: Comparar**

Com cookie SP:
- Clima pré-selecionado "Clima quente" e texto "Você está em SP".
- Original SAE 500, candidata SAE 450 → "Aceitável", 90%.
- Candidata 445 → "Só com ressalva", 89%. Candidata 395 → "Não recomendado" com "mais de 20% abaixo".
- Trocar para Diesel com 450 → "Não recomendado" com o motivo diesel.
- Start-stop com 520 → "Compatível" com o aviso de tecnologia.
- Original SAE 600, candidata EN 560 → "Aceitável" com o aviso de normas diferentes.
- Trocar para a aba Converter e voltar → os valores do Comparar continuam lá.

Com cookie RS: clima pré-selecionado "Sul / serra (frio)"; SAE 500 contra 450 → "Não recomendado" com o motivo de região fria.

- [ ] **Step 5: Celular e prévia**

- Largura de 375 px: sem rolagem horizontal, chips quebram linha.
- Abrir `http://localhost:3000/corrente-de-partida/opengraph-image` → imagem 1200×630 com o título "Corrente de partida".
- `curl -s http://localhost:3000/corrente-de-partida | grep -o '<meta name="robots"[^>]*>'` → contém `noindex`.

Se algum passo falhar, corrigir na task dona do arquivo, rodar `bun test lib/corrente-partida` e commitar com a mensagem descrevendo a correção.
