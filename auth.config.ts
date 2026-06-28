import type { NextAuthConfig } from "next-auth"

// Config base, segura para o Edge (middleware): sem acesso a banco/bcrypt.
// Os providers (Credentials) ficam em auth.ts (runtime Node).
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/parceiro365/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.nome = (user as any).nome
        token.cidade = (user as any).cidade
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).nome = token.nome
        ;(session.user as any).cidade = token.cidade
      }
      return session
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLogin = pathname === "/parceiro365/login"
      const isEmitir = pathname.startsWith("/parceiro365/emitir")
      const role = (auth?.user as any)?.role
      const logged = !!auth?.user

      // Rotas públicas dentro de /parceiro365
      if (isEmitir) return true
      if (isLogin) {
        if (logged) return Response.redirect(new URL("/parceiro365", request.nextUrl))
        return true
      }

      // Demais rotas do portal exigem sessão
      if (!logged) return false
      // Área /admin é só do super admin
      if (pathname.startsWith("/parceiro365/admin") && role !== "super_admin") {
        return Response.redirect(new URL("/parceiro365", request.nextUrl))
      }
      return true
    },
  },
} satisfies NextAuthConfig
