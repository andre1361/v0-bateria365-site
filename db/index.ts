import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Driver HTTP do Neon (porta 443) — funciona em serverless (Vercel) e no sandbox.
// Aceita os nomes de variável que a integração Neon/Vercel pode usar.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING
if (!connectionString) {
  throw new Error("Connection string ausente (defina DATABASE_URL ou POSTGRES_URL em .env.local / Vercel).")
}

export const db = drizzle(neon(connectionString), { schema })
export * from "./schema"
