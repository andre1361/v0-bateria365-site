"use server"

import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"

export type LoginState = { error?: string }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/parceiro365",
    })
    return {}
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-mail ou senha inválidos." }
    throw e // repassa o NEXT_REDIRECT de sucesso
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/parceiro365/login" })
}
