# Gerador de propostas de treinamento — design

Data: 2026-10-08 · Status: aguardando revisão do Rafael

## Objetivo

Dentro do Parceiro 365, o super admin monta a proposta de treinamento Bateria 365 para um distribuidor. Ela é calculada a partir do preço real das passagens (SerpApi / Google Flights) nas datas da viagem e dos custos fixos editáveis. O distribuidor recebe um link com chave de acesso, vê o valor total e aceita online. O aceite cria o treinamento na agenda dele.

Sucesso = em poucos minutos o super admin escolhe o distribuidor, a data e os voos, gera o link e manda pelo WhatsApp. O distribuidor abre, vê um único valor, aceita, e o treinamento aparece em **Treinamentos** sem trabalho manual.

## Escopo

Dentro (fase 1):
- Uso só pelo super admin: criar, editar, enviar, cancelar e renovar propostas.
- Busca de voos ida e volta para as duas origens fixas, com cache de 6h.
- Padrões de custo editáveis numa tela de configurações e ajustáveis por proposta.
- Página pública com chave de acesso, valor total, validade e aceite que cria o evento.

Fora (fase 2, spec separada):
- Autoatendimento do distribuidor (escolher a data e ver o custo na hora).
- Calendário de preços por data.
- PDF gerado no servidor (a fase 1 usa a impressão do navegador).
- Detalhamento de custos para o distribuidor.
- Cadastro de profissionais/instrutores.

O cálculo fica em `lib/proposta/` como função pura, para ser reaproveitado na fase 2.

## Regras de negócio

**Viajantes:** sempre os dois profissionais, fixos no código (`lib/proposta/origens.ts`):

| id | Profissional sai de | Aeroporto |
|---|---|---|
| `poa` | Porto Alegre | POA |
| `sjp` | São José do Rio Preto | SJP |

**Datas:** treinamento de **N dias** (padrão 1) começando no dia **D**:
- Ida: **D − 1**
- Volta: **D + N** (dia seguinte ao último dia de treinamento)

**Custos** (em centavos, inteiros):

| Item | Fórmula | Padrão |
|---|---|---|
| Passagens | preço ida+volta POA + preço ida+volta SJP | SerpApi ou manual |
| Hotel | diária × (N + 1) × 2 pessoas | R$ 350,00 |
| Alimentação | valor/dia × (N + 2) × 2 pessoas | R$ 200,00 |
| Uber | valor fixo por proposta (para a dupla) | R$ 200,00 |
| Honorário | valor fixo por treinamento | R$ 12.000,00 |
| Acréscimo | % sobre o subtotal | 0% |

`subtotal = passagens + hotel + alimentação + uber + honorário`
`total = round(subtotal × (1 + acréscimo/100))`, arredondado ao centavo.

Exemplo: N = 1, passagens POA R$ 1.500 e SJP R$ 1.800:
3.300 + 1.400 + 1.200 + 200 + 12.000 = **R$ 18.100,00**.

**Destino igual a uma origem** (ex.: treinamento em Porto Alegre): a passagem daquele profissional sai como R$ 0 e não há busca. Hotel e alimentação continuam contando para os dois. Se precisar, o super admin ajusta os valores.

**Validade:** padrão de 10 dias a partir do envio, editável por proposta.

## Dados (Drizzle)

### `proposal_settings` (uma linha)
`id`, `hotelDiaria`, `alimentacaoDia`, `uberFixo`, `honorario` (centavos), `acrescimoPct` (inteiro, em centésimos de %: 0 = 0%, 650 = 6,5%), `validadeDias`, `updatedAt`. Criada pela migração com os padrões acima.

### `proposals`
- `id`, `distributorId` (FK `users`, cascade), `slug` (único)
- `chaveHash` (bcrypt) e `chavePlain` (para o admin reenviar, como `users.senhaPlain`)
- `destinoIata`, `destinoCidade`, `dataInicioISO`, `duracaoDias`, `idaISO`, `voltaISO`
- `parametros` (jsonb): cópia de hotel, alimentação, uber, honorário e acréscimo usados nesta proposta. Mudar os padrões depois não altera propostas antigas.
- `voos` (jsonb): por origem `{ origem, modo: "serpapi" | "manual" | "local", preco, companhia?, partida?, chegada?, duracaoMin?, escalas? }`
- `total` (centavos), `validaAte` (timestamp), `status` (enum `rascunho | enviada | aceita | cancelada`)
- `enviadaEm`, `aceitaEm`, `eventId` (FK `events`, set null), `createdAt`, `updatedAt`

**Status efetivo** (função pura): `enviada` com `validaAte` no passado é exibida e tratada como **expirada**. Não existe status gravado para expirada.

### `flight_search_cache`
`chave` (PK, texto `ORIGEM-DESTINO-IDA-VOLTA`), `resultados` (jsonb, opções já normalizadas), `buscadoEm`. Vale por 6h.

## Busca de voos — `lib/proposta/serpapi.ts`

- Requisição: `engine=google_flights`, `departure_id`, `arrival_id`, `outbound_date`, `return_date`, `type=1` (ida e volta), `currency=BRL`, `hl=pt-br`, `gl=br`, `adults=1`, `api_key=SERPAPI_API_KEY`.
- A resposta de ida e volta lista as opções de **ida** com o **preço total da viagem**. Os horários da volta exigiriam uma consulta extra por opção e ficam de fora: a tela mostra só os detalhes da ida e o preço total.
- Normalização (função pura): junta `best_flights` e `other_flights`, descarta itens sem preço, ordena por preço e limita a 5. Cada opção tem `{ preco, companhia, partida, chegada, duracaoMin, escalas }`.
- As duas origens são buscadas em paralelo.
- Cache: a server action consulta `flight_search_cache`. Se houver resultado de menos de 6h, usa esse resultado. "Buscar de novo" força uma nova consulta e atualiza o cache.
- Falhas tratadas por origem: chave ausente ("Busca de voos não configurada — use o valor manual"), erro HTTP ou de crédito, `error` no JSON, lista vazia ("Nenhum voo encontrado nessas datas"). A outra origem segue normal e a origem com falha mostra o campo de valor manual.

## Aeroportos — `lib/proposta/aeroportos.ts`

- Lista fixa dos aeroportos brasileiros com voo comercial: `{ iata, nome, cidade, uf }`.
- Busca sem considerar acento nem maiúsculas, por cidade, nome ou código.
- `sugerirAeroporto(cidadeDistribuidor)`: casa pela cidade normalizada. Sem correspondência, devolve `null` e o campo fica vazio.

## Telas do super admin

Novo item **"Propostas"** na barra lateral do super admin.

**Lista** — `/parceiro365/admin/propostas`
- Tabela com distribuidor, destino, data do treinamento, total, status efetivo (cores diferentes) e validade. Propostas aceitas têm link para o evento.
- Botões "Nova proposta" e "Configurações" (`/parceiro365/admin/propostas/configuracoes`, edita `proposal_settings`).

**Editor** — `/parceiro365/admin/propostas/[id]` (`nova` cria um rascunho)
1. Distribuidor (lista de `users` com papel distribuidor e ativos). Sugere o aeroporto de destino.
2. Treinamento: aeroporto de destino (busca), data de início, duração. Mostra "Ida: … · Volta: …".
3. Voos: botão "Buscar voos". Duas colunas, Porto Alegre e São José do Rio Preto, com as opções em botões de escolha, a mais barata pré-selecionada e "Usar valor manual".
4. Custos: campos preenchidos com os padrões e editáveis.
5. Resumo fixo: detalhamento completo e total, recalculados ao vivo com a mesma função do `lib/`.

Ações:
- **Salvar rascunho**.
- **Gerar link**: exige destino, data e preço para as duas origens. Muda o status para `enviada`, gera `slug` e chave de 6 caracteres (sem caracteres ambíguos, como 0/O e 1/I), define `validaAte = agora + validadeDias`. Mostra link e chave com botões de copiar e "Copiar mensagem para WhatsApp".
- **Cancelar**: status `cancelada`.
- **Renovar** (expirada): refaz a busca de voos e, ao gerar o link de novo, define uma nova validade com o mesmo `slug` e a mesma chave.
Regras de edição (por status efetivo):
- `rascunho`: tudo editável.
- `enviada` dentro da validade: editável. Salvar recalcula o total e mantém link, chave e validade. A validade só muda ao gerar o link de novo.
- `expirada`: editável ("Renovar").
- `aceita` e `cancelada`: somente leitura.

Segurança: todas as server actions chamam `requireAdmin()`. O total é sempre recalculado no servidor a partir dos campos. O total enviado pelo cliente é ignorado.

## Página do distribuidor — `/parceiro365/proposta/[slug]`

- Pública: entra na lista de rotas públicas de `auth.config.ts`, junto de `emitir` e `convite`.
- Chave de acesso no padrão do `emitir/[slug]`: formulário, `bcrypt.compare` e cookie httpOnly assinado, com `path` restrito à proposta e validade de 6h.
- Chave errada: "Chave incorreta". Slug inexistente ou proposta cancelada/rascunho: "Proposta indisponível".
- Conteúdo, com a marca Parceiro 365, legível no celular e com estilo para impressão:
  - para: nome e cidade do distribuidor
  - treinamento: data(s), duração, cidade
  - **Investimento total: R$ X** (sem detalhamento)
  - "O valor inclui honorário dos instrutores, passagens aéreas, hospedagem, alimentação e transporte."
  - "Proposta válida até DD/MM/AAAA"
  - botão "Aceitar proposta" com confirmação
- Estados: enviada e dentro da validade (com aceite), expirada (proposta apagada, aviso para falar com a equipe, sem botão), aceita ("Proposta aceita em DD/MM/AAAA. Seu treinamento já está na agenda.").

**Aceite** (server action). O driver `neon-http` (`db/index.ts`) não tem transação interativa, então o aceite é feito com uma "reserva" atômica:
1. Confere o cookie.
2. Reserva: `UPDATE proposals SET status='aceita', aceitaEm=now() WHERE id = … AND status = 'enviada' AND validaAte > now() RETURNING id`. Se nenhuma linha voltar, a proposta já foi aceita, expirou ou foi cancelada, e a página mostra o estado atual. Assim, aceite duplo não cria dois eventos.
3. Cria `events` para o distribuidor: título "Treinamento Bateria 365", `dataISO` = data de início, `cidade` = cidade de destino e `slug` no mesmo padrão do `saveEvent`.
4. Grava `eventId` na proposta.
5. Se o passo 3 falhar, volta a proposta para `enviada` (`aceitaEm = null`) e mostra "Não foi possível concluir o aceite, tente de novo".

## Testes

`bun test`, em `lib/proposta/*.test.ts`:
- `calculo.test.ts`: datas de ida e volta para 1 e 3 dias, com virada de mês e de ano; diárias e dias de alimentação; total do exemplo (R$ 18.100); acréscimo e arredondamento; passagem R$ 0 com destino igual à origem; valor manual.
- `serpapi.test.ts`: normalização de uma resposta real salva como fixture (junção, ordenação, limite de 5), resposta vazia e resposta com `error`.
- `aeroportos.test.ts`: busca sem acento ("sao jose" → SJP), por código, e `sugerirAeroporto`.
- `status.test.ts`: status efetivo (enviada vencida → expirada) e regras de edição.

Checagem no navegador, no fim: criar uma proposta de ponta a ponta, abrir o link, testar chave errada e certa, aceitar, ver o evento em Treinamentos, testar proposta expirada e cancelada.

## Implantação

- Migração Drizzle com as 3 tabelas, o enum de status e a linha de `proposal_settings`.
- `SERPAPI_API_KEY` na Vercel (Production e Preview). Sem a chave, o restante funciona com valor manual.
- Branch `feat/gerador-propostas`, PR e merge na `main`.
