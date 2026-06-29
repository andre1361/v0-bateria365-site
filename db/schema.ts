import { pgTable, pgEnum, text, timestamp, boolean, uuid, jsonb, integer } from "drizzle-orm/pg-core"

// Papéis de usuário do portal.
export const roleEnum = pgEnum("role", ["super_admin", "distribuidor"])

// Usuários: super admin (gerencia distribuidores) e distribuidores (usam o portal).
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("distribuidor"),
  nome: text("nome").notNull(),
  cidade: text("cidade").notNull().default(""),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Empresas (clientes do distribuidor) que alinham convidados para os treinamentos.
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

export type User = typeof users.$inferSelect
export type Company = typeof companies.$inferSelect
export type Student = typeof students.$inferSelect
export type Certificate = typeof certificates.$inferSelect
export type EmitLink = typeof emitLinks.$inferSelect
export type Invite = typeof invites.$inferSelect
export type Raffle = typeof raffles.$inferSelect
export type Event = typeof events.$inferSelect
export type Rsvp = typeof rsvps.$inferSelect
