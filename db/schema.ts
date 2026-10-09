import { pgTable, pgEnum, text, timestamp, boolean, uuid, jsonb, integer } from "drizzle-orm/pg-core"
import type { Parametros, Voos } from "../lib/proposta/calculo"
import type { OpcaoVoo } from "../lib/proposta/serpapi"

// Papéis de usuário do portal.
export const roleEnum = pgEnum("role", ["super_admin", "distribuidor"])

// Usuários: super admin (gerencia distribuidores) e distribuidores (usam o portal).
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // Senha em texto do distribuidor — guardada só para o admin reenviar o acesso
  // (ex.: por WhatsApp). Nula para contas antigas/super admin.
  senhaPlain: text("senha_plain"),
  role: roleEnum("role").notNull().default("distribuidor"),
  nome: text("nome").notNull(),
  cidade: text("cidade").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Vendedores da distribuidora (equipe do distribuidor), atribuíveis às empresas.
export const sellers = pgTable("sellers", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull().default(""),
  email: text("email").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Empresas (clientes do distribuidor) que alinham convidados para os treinamentos.
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  cidade: text("cidade").notNull().default(""),
  responsavel: text("responsavel").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  email: text("email").notNull().default(""),
  convidadosPrevistos: integer("convidados_previstos").notNull().default(0),
  observacoes: text("observacoes").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Alunos cadastrados por um distribuidor (opcionalmente vinculados a uma empresa).
export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  email: text("email").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  empresa: text("empresa").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Log de certificados emitidos.
export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  alunoNome: text("aluno_nome").notNull(),
  empresa: text("empresa").notNull().default(""),
  dataTreino: text("data_treino").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
})

// Link de auto-emissão por senha (um por distribuidor).
export const emitLinks = pgTable("emit_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  slug: text("slug").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Log de convites gerados (a arte é renderizada/baixada no cliente).
export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  template: text("template").notNull(),
  cidade: text("cidade").notNull().default(""),
  data: text("data").notNull().default(""),
  horario: text("horario").notNull().default(""),
  distribuidorNome: text("distribuidor_nome").notNull().default(""),
  local: text("local").notNull().default(""),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
})

// Sorteios realizados.
export const raffles = pgTable("raffles", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull().default(""),
  participantes: jsonb("participantes").$type<string[]>().notNull().default([]),
  ganhadores: jsonb("ganhadores").$type<string[]>().notNull().default([]),
  semRepeticao: boolean("sem_repeticao").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
})

// Eventos (treinamentos) com link público de convite + confirmação de presença.
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  modulo: text("modulo").notNull().default(""),
  dataISO: text("data_iso").notNull().default(""),
  horario: text("horario").notNull().default(""),
  cidade: text("cidade").notNull().default(""),
  local: text("local").notNull().default(""),
  responsavel: text("responsavel").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  template: text("template").notNull().default("square"),
  // Foto de fundo personalizada do convite (modelo quadrado). Vazio = arte padrão.
  fundoUrl: text("fundo_url").notNull().default(""),
  // Arte montada do convite (PNG) para a prévia ao compartilhar (og:image).
  arteUrl: text("arte_url").notNull().default(""),
  slug: text("slug").notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Confirmações de presença (RSVP) de um evento.
export const rsvps = pgTable("rsvps", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull().default(""),
  email: text("email").notNull().default(""),
  empresa: text("empresa").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Páginas de links públicas (estilo Linktree) criadas pelo super admin.
export type LinkItem = { id: string; titulo: string; url: string; imagem: string }
export type LinkTab = { id: string; nome: string; items: LinkItem[] }

export const linkPages = pgTable("link_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull().default(""),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url").notNull().default(""),
  accent: text("accent").notNull().default(""),
  tabs: jsonb("tabs").$type<LinkTab[]>().notNull().default([]),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

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

export type User = typeof users.$inferSelect
export type Seller = typeof sellers.$inferSelect
export type Company = typeof companies.$inferSelect
export type Student = typeof students.$inferSelect
export type Certificate = typeof certificates.$inferSelect
export type EmitLink = typeof emitLinks.$inferSelect
export type Invite = typeof invites.$inferSelect
export type Raffle = typeof raffles.$inferSelect
export type Event = typeof events.$inferSelect
export type Rsvp = typeof rsvps.$inferSelect
export type LinkPage = typeof linkPages.$inferSelect
export type Proposal = typeof proposals.$inferSelect
export type ProposalSettings = typeof proposalSettings.$inferSelect
