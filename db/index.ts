import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Driver HTTP do Neon (porta 443) — funciona em serverless (Vercel) e no sandbox.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL não definida (configure em .env.local / Vercel).")
}

export const db = drizzle(neon(connectionString), { schema })
export * from "./schema"
