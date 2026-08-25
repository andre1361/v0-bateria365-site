import { cookies } from "next/headers"
import { and, eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"

// Cookie que marca qual distribuidor o super admin está "acessando".
export const IMPERSONATION_COOKIE = "pf365_imp"

export type SessionUser = {
  id: string
  role: "super_admin" | "distribuidor"
  nome: string
  cidade: string
  email?: string | null
}

export type EffectiveUser = SessionUser & { impersonating: boolean; realAdminName?: string }

async function realSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user
  return {
    id: u.id,
    role: u.role,
    nome: u.nome || u.name || "",
    cidade: u.cidade || "",
    email: u.email,
  }
}

// Identidade efetiva do portal. Se o super admin estiver acessando a conta de
// um distribuidor (cookie de impersonação), passa a agir COMO esse distribuidor
// — todos os dados do portal ficam no escopo dele. Caso contrário, é o próprio
// usuário logado. Defesa em profundidade nas server actions, além do middleware.
export async function requireUser(): Promise<EffectiveUser> {
  const real = await realSessionUser()
  if (!real) throw new Error("Não autenticado.")

  if (real.role === "super_admin") {
    const impId = (await cookies()).get(IMPERSONATION_COOKIE)?.value
    if (impId) {
      const [d] = await db
        .select({ id: users.id, nome: users.nome, cidade: users.cidade, email: users.email })
        .from(users)
        .where(and(eq(users.id, impId), eq(users.role, "distribuidor")))
      if (d) {
        return { id: d.id, role: "distribuidor", nome: d.nome, cidade: d.cidade, email: d.email, impersonating: true, realAdminName: real.nome }
      }
    }
  }

  return { ...real, impersonating: false }
}

// requireAdmin usa SEMPRE a identidade real — o super admin mantém os poderes de
// admin mesmo enquanto está "dentro" da conta de um distribuidor.
export async function requireAdmin(): Promise<SessionUser> {
  const real = await realSessionUser()
  if (!real) throw new Error("Não autenticado.")
  if (real.role !== "super_admin") throw new Error("Acesso restrito ao super admin.")
  return real
}
