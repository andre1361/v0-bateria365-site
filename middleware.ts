import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// Middleware de proteção/RBAC do portal — usa apenas a config edge-safe.
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/parceiro365/:path*"],
}
