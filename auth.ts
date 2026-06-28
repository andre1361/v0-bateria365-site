import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { authConfig } from "./auth.config"
import { db } from "./db"
import { users } from "./db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase()
        const password = String(credentials?.password || "")
        if (!email || !password) return null

        const rows = await db.select().from(users).where(eq(users.email, email))
        const u = rows[0]
        if (!u || !u.ativo) return null

        const ok = await bcrypt.compare(password, u.passwordHash)
        if (!ok) return null

        return {
          id: u.id,
          email: u.email,
          name: u.nome,
          role: u.role,
          nome: u.nome,
          cidade: u.cidade,
        } as any
      },
    }),
  ],
})
