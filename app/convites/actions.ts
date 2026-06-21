"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CONVITES_COOKIE, CONVITES_SESSION_MAX_AGE, getConvitesPassword, getConvitesToken } from "./auth"

export type ConvitesAuthState = {
  success: boolean
  message: string
}

// Valida a senha enviada no formulário de acesso. Em caso de sucesso, grava um
// cookie httpOnly de sessão e redireciona para o editor. Em caso de falha,
// retorna o estado de erro para ser exibido no formulário.
export async function verifyConvitesPassword(
  _prevState: ConvitesAuthState,
  formData: FormData,
): Promise<ConvitesAuthState> {
  const password = formData.get("password")

  if (typeof password !== "string" || password.length === 0) {
    return { success: false, message: "Digite a senha para continuar." }
  }

  if (password !== getConvitesPassword()) {
    return { success: false, message: "Senha incorreta. Tente novamente." }
  }

  const cookieStore = await cookies()
  cookieStore.set(CONVITES_COOKIE, getConvitesToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/convites",
    maxAge: CONVITES_SESSION_MAX_AGE,
  })

  redirect("/convites")
}

// Encerra a sessão do editor removendo o cookie.
export async function logoutConvites(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete({ name: CONVITES_COOKIE, path: "/convites" })
  redirect("/convites")
}
