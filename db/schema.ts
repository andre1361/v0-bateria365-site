import { pgTable, pgEnum, text, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core"

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

// Alunos cadastrados por um distribuidor.
export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  distributorId: uuid("distributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

export type User = typeof users.$inferSelect
export type Student = typeof students.$inferSelect
export type Certificate = typeof certificates.$inferSelect
export type EmitLink = typeof emitLinks.$inferSelect
export type Invite = typeof invites.$inferSelect
export type Raffle = typeof raffles.$inferSelect
