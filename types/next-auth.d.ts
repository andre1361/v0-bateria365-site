import type { DefaultSession } from "next-auth"

type Role = "super_admin" | "distribuidor"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      nome: string
      cidade: string
    } & DefaultSession["user"]
  }
  interface User {
    role?: Role
    nome?: string
    cidade?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: Role
    nome?: string
    cidade?: string
  }
}
