# Conversor de corrente de partida — design

Data: 2026-10-03 · Status: aguardando revisão do Rafael

## Objetivo

Ferramenta para o lojista que fez o Bateria 365. Ele recebe uma bateria (muitas vezes importada) com a corrente de partida numa norma diferente da especificação original do carro e precisa saber:

1. quanto aquele valor vale nas outras normas (**Converter**);
2. se a bateria candidata serve no lugar da original, considerando que a maior parte do Brasil é tropical e não precisa da mesma corrente de partida que a Europa (**Comparar**).

Sucesso = o lojista, no celular do balcão, converte o valor da etiqueta em segundos e recebe um parecer claro ("compatível / aceitável / só com ressalva / não recomendado") com a justificativa.

## Escopo

Dentro:
- Normas: SAE J537 (CCA), ABNT NBR 15940, JIS D 5301 (2006+), EN 50342-1, IEC 60095 antiga, DIN 43539/72311, CA/MCA. SAE é a base e o padrão da tela.
- Código JIS (ex.: `55B24L`): decodificação e CCA de referência.
- Parecer com margem tropical por UF e por tipo de veículo.
- Mesmo acesso do `/codigo-radio`: link fora do Google, trava por localização, prévia própria no WhatsApp.

Fora:
- EN antiga "EN2" (pré-2006) e JIS 1999 (não geram CCA comparável). A página só cita que não são convertidas.
- Busca de bateria por veículo/modelo, catálogo Moura, histórico de consultas, persistência no servidor.

## Tabela de normas (base SAE)

Fator = quanto multiplicar o valor da norma para obter SAE. Cada norma tem uma faixa `[min, max]` porque nenhum fabricante publica fator oficial e as tabelas de mercado divergem até ~±10%.

| id | Rótulo na tela | Ensaio | Fator → SAE `[min, max]` | Fonte |
|---|---|---|---|---|
| `sae` | SAE (CCA) | −18 °C, 30 s, ≥7,2 V | `[1, 1]` | SAE J537 |
| `nbr` | NBR (Brasil / Inmetro) | igual SAE | `[1, 1]` | NBR 15940:2019, RTQ Inmetro 2022 |
| `jis` | JIS (CCA) | igual SAE (JIS D 5301:2006+) | `[1, 1]` | JIS D 5301:2019, GS Yuasa "CCA SAE(A)" |
| `en` | EN | −18 °C, 10 s ≥7,5 V + 73 s | `[1.04, 1.11]` | CTEK, Shield, Yuasa UK |
| `iec` | IEC (antiga, 60 s) | −18 °C, 60 s, 8,4 V | `[1.50, 1.58]` | CTEK (×1,54; faixa de ±2,5% arbitrada) |
| `din` | DIN | −18 °C, ≥9 V aos 30 s | `[1.67, 1.82]` | CTEK, Varta, Shield |
| `ca` | CA / MCA (0 °C) | 0 °C, 30 s, 7,2 V | `[0.77, 0.81]` | CA ≈ CCA × 1,23–1,30 |

Notas exibidas na tela:
- IEC recente (60095-1:2006+) já equivale à EN: se a etiqueta trouxer IEC com ano 2006 ou depois, use EN.
- DIN vale ~60% do EN: não confundir.

### Conversão

- `paraSae(valor, norma)` → `{ min: valor × fator.min, max: valor × fator.max, centro: valor × (min+max)/2 }`.
- `deSae(faixaSae, norma)` → `{ min: sae.min ÷ fator.max, max: sae.max ÷ fator.min, centro: sae.centro ÷ média(fator) }`.
- Tela mostra `≈ centro` arredondado de 5 em 5 A e, abaixo, `faixa min–max` quando min ≠ max.
- Entrada válida: inteiro de 50 a 2000 A. Fora disso, mensagem de erro no campo.

### Código JIS

Normalização: maiúsculas, remove espaços e hífen, descarta sufixo final `S` ou `MF`. Depois casa com `^(\d{2,3})([A-H])(\d{2})(L|R)?$`.

Decodificação mostrada:
- `55` → classe de desempenho (não é ampère: mistura CCA e capacidade de reserva);
- `B` → largura/altura da caixa (B ≈ 127 mm, D ≈ 173 mm …);
- `24` → comprimento ≈ 24 cm;
- `L/R` → lado do polo negativo.

CCA de referência (catálogos GS Yuasa e listas japonesas):

| 34B19 | 38B19 | 46B24 | 55B24 | 60B24 | 55D23 | 75D23 | 80D23 | 80D26 | 95D31 | 105D31 | 115D31 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 240 | 265 | 295 | 370 | 405 | 320 | 465 | 500 | 490 | 565 | 655 | 735 |

Código conhecido → preenche o valor com a CCA de referência e a norma JIS, com o aviso "Valor de referência. Se a etiqueta trouxer a CCA, use o valor da etiqueta." Código válido mas fora da tabela → mostra só a decodificação e pede o valor da etiqueta. Código inválido → erro no campo.

## Parecer (Comparar)

Entradas: original (valor + norma), candidata (valor + norma), tipo de veículo, clima.

Cálculo da razão, sempre em SAE:
- mesma norma dos dois lados → `razão = candidata ÷ original` (sem incerteza);
- normas diferentes → `razão = candidata.min (SAE) ÷ original.max (SAE)` (pior caso das duas conversões). A incerteza da conversão nunca favorece a candidata; o aviso de normas diferentes aparece quando algum dos lados tem faixa (min < max).

Tipo de veículo: `flex` (gasolina/flex/etanol, bateria convencional) · `diesel` · `start-stop` (EFB/AGM).

Clima: `tropical` ou `frio`. Padrão vem da UF do cookie da trava: RS, SC, PR → `frio`; demais → `tropical`. O lojista pode trocar (ex.: serras de SP/MG).

Regra exigente = `diesel` OU `start-stop` OU `frio`.

| Razão | Regra normal (flex + tropical) | Regra exigente |
|---|---|---|
| ≥ 1,00 | `compativel` | `compativel` |
| 0,90–0,99 | `aceitavel` | `nao-recomendado` |
| 0,80–0,89 | `ressalva` | `nao-recomendado` |
| < 0,80 | `nao-recomendado` | `nao-recomendado` |

A razão é comparada sem arredondar (0,899 é `ressalva`). A porcentagem exibida é truncada, não arredondada, para nunca mostrar "90%" num caso de ressalva.

Textos (explicação do parecer):
- `compativel`: "A candidata tem corrente de partida igual ou maior que a original. Pode instalar." Bateria com CCA maior não prejudica o carro (Moura).
- `aceitavel`: "Até 10% abaixo da original: dentro da diferença entre as normas. Em clima quente a bateria entrega mais corrente e o motor pede menos para girar."
- `ressalva`: "Entre 10% e 20% abaixo. Só para carro flex/gasolina com bateria convencional, fora do Sul e das serras, e com sistema elétrico original. Avise o cliente."
- `nao-recomendado`: o motivo específico — "mais de 20% abaixo da original" ou "diesel / start-stop / região fria exigem corrente igual ou maior que a original".
- `start-stop` sempre acrescenta: "Start-stop exige a mesma tecnologia da original: EFB por EFB (ou AGM), AGM só por AGM."

O parecer mostra também os dois valores em SAE e a porcentagem (`candidata = 87% da original`).

Base técnica (no "Como calculamos", recolhível): a 0 °C a bateria entrega ~25% mais que a −18 °C e o motor pede ~13% menos; fora do Sul a folga real é ~1,4×. A margem é conservadora porque a conversão entre normas tem incerteza de ±10% e a bateria perde CCA com o uso. Moura recomenda CCA igual ou superior à original no Sul e nas serras.

## Arquitetura

```
lib/corrente-partida/
  normas.ts        tabela NORMAS, tipo NormaId, paraSae, deSae, arredondar
  jis.ts           decodificarJis, CCA_JIS (tabela de referência)
  parecer.ts       climaPorUf, calcularParecer → { nivel, razao, saeOriginal, saeCandidata, motivos[] }
  *.test.ts        bun test
app/corrente-de-partida/
  page.tsx               server: metadata noindex + OG; lê o cookie de região; sem região → <RegiaoGate>; com região → <ConversorClient uf={uf}>
  conversor-client.tsx   client: abas Converter / Comparar
  opengraph-image.tsx    ogCard({ titulo: "Corrente de partida", … rodape: "bateria365.com.br/corrente-de-partida" })
components/regiao-gate.tsx   movido de app/codigo-radio/regiao-gate.tsx, com props titulo/subtitulo/textoLiberacao
```

- Tudo em `lib/corrente-partida/` é função pura, sem React nem servidor; a página roda 100% no navegador depois de liberada.
- Trava de região: reaproveita `lib/radio-code/regiao.ts`, o cookie `codigo_radio_regiao` (path `/`) e a rota `POST /api/codigo-radio/regiao` sem mudanças. Quem liberou uma ferramenta não precisa liberar a outra. Nomes mantidos para não invalidar os cookies já emitidos.
- `RegiaoGate` vira componente compartilhado com textos por props; `/codigo-radio` passa os textos atuais (comportamento idêntico).
- Visual: o mesmo do `/codigo-radio` (fundo `#eef2f8`, card branco arredondado, logo Bateria 365, largura `max-w-md`, componentes de `components/ui`).

## Tela

**Converter**
- Seletor de norma de entrada (SAE pré-selecionada) + campo de valor em A; para JIS, um campo opcional de código (sempre visível quando JIS está selecionada).
- Resultado: lista de todas as normas com `≈ valor` e faixa, a de entrada destacada; SAE sempre no topo.

**Comparar**
- Bloco "Bateria original": valor + norma. Bloco "Bateria candidata": valor + norma (ou código JIS).
- Tipo de veículo (3 opções) e clima (pré-preenchido pela UF, ex.: "Tropical — você está em SP", com troca).
- Card de parecer colorido (verde / verde / âmbar / vermelho), porcentagem, valores em SAE, explicação e motivos.

Rodapé: "Valores de referência. Na dúvida, vale a especificação da montadora."

## Erros e casos de borda

- Valor vazio, não numérico ou fora de 50–2000 → mensagem no campo, sem resultado.
- Código JIS inválido → "Código JIS não reconhecido. Ex.: 55B24L."
- UF sem cookie válido → a página mostra a trava (não há parecer sem região).

## Testes (`bun test`)

- `normas`: SAE→SAE identidade; EN 600 → SAE faixa 624–666; DIN 300 → SAE 501–546; ida e volta SAE→EN→SAE contém o valor original; arredondamento de 5 em 5.
- `jis`: `55B24L`, `55b24-l`, `80D26R`, `95D31` decodificam; `55B24L` → 370; `40B20L` válido sem CCA; `XYZ` inválido.
- `parecer`: fronteiras 1,00 / 0,90 / 0,89 / 0,80 / 0,79 em flex+tropical; as mesmas razões com diesel, start-stop e frio; mesma norma usa razão direta; normas diferentes usam `candidata.min`; `climaPorUf` para RS/SC/PR/SP/AM.
- `/codigo-radio` continua liberando e bloqueando igual após mover o `RegiaoGate` (verificação manual no navegador).

## Fontes

Battery University BU-902a e BU-502; Shield Batteries; tabela CTEK; Varta (testador e start-stop); EN 50342-1:2015+A2; JIS D 5301:2019 (prévia JSA); GS Yuasa (catálogos 2026 e Y5); RTQ Inmetro (NBR 15940:2019); Moura blog "CCA bateria"; Heliar; AAA; mechanic.com.au; EUROBAT. Faixas do parecer são inferência da Bateria 365 a partir dessas fontes, não norma publicada.
