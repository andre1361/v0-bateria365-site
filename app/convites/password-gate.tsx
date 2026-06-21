"use client"

import { useActionState } from "react"
import Image from "next/image"
import { Lock } from "lucide-react"
import { verifyConvitesPassword, type ConvitesAuthState } from "./actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const initialState: ConvitesAuthState = { success: false, message: "" }

export function PasswordGate() {
  const [state, formAction, isPending] = useActionState(verifyConvitesPassword, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <Image
            src="/images/logo-bateria365-claro.png"
            alt="Bateria 365"
            width={180}
            height={60}
            className="h-12 w-auto mb-6"
            priority
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Editor de Convites</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Área restrita. Informe a senha de acesso para gerar os convites.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="password">Senha de acesso</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-secondary text-primary font-bold rounded-full h-12 shadow-lg transform hover:scale-105 transition-all hover:bg-primary hover:text-secondary"
          >
            {isPending ? "Verificando..." : "Entrar"}
          </Button>

          {state?.message && <p className="text-red-600 text-sm text-center">{state.message}</p>}
        </form>
      </div>
    </div>
  )
}
