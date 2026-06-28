import { auth } from "@/auth"

export type SessionUser = {
  id: string
  role: "super_admin" | "distribuidor"
  nome: string
  cidade: string
  email?: string | null
}

// Garante sessão (defesa em profundidade nas server actions, além do middleware).
export async function requireUser(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  const u = session.user
  return {
    id: u.id,
    role: u.role,
    nome: u.nome || u.name || "",
    cidade: u.cidade || "",
    email: u.email,
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser()
  if (u.role !== "super_admin") throw new Error("Acesso restrito ao super admin.")
  return u
}
