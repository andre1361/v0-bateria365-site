"use client"

import type React from "react"

import { useActionState, useState } from "react"
import { submitContactForm } from "@/app/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react" // Importe o ícone Zap

const initialState = {
  success: false,
  message: "",
  errors: {},
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)
  const [phone, setPhone] = useState("") // Novo estado para o telefone

  const formatPhoneNumber = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "") // Remove tudo que não é dígito
    if (value.length > 11) value = value.slice(0, 11) // Limita a 11 dígitos

    if (value.length <= 2) {
      return `(${value}`
    } else if (value.length <= 7) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else if (value.length <= 11) {
      return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value)
    setPhone(formattedValue)
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="distributorName">Nome do Distribuidor</Label>
        <Input
          id="distributorName"
          name="distributorName"
          type="text"
          placeholder="Seu nome ou nome da empresa"
          required
          className="mt-1"
        />
        {state?.errors?.distributorName && <p className="text-red-500 text-sm mt-1">{state.errors.distributorName}</p>}
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required className="mt-1" />
        {state?.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="(XX) XXXXX-XXXX"
          required
          className="mt-1"
          value={phone} // Adicione esta linha
          onChange={handlePhoneChange} // Adicione esta linha
        />
        {state?.errors?.phone && <p className="text-red-500 text-sm mt-1">{state.errors.phone}</p>}
      </div>
      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" name="city" type="text" placeholder="Sua cidade" required className="mt-1" />
        {state?.errors?.city && <p className="text-red-500 text-sm mt-1">{state.errors.city}</p>}
      </div>
      <Button
        type="submit"
        className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-lg px-8 h-16 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center mx-auto block whitespace-nowrap min-w-fit hover:bg-[#003A78] hover:text-[#FFC700]"
        disabled={isPending}
      >
        <span className="flex items-center justify-center">
          {" "}
          {/* Wrapper para ícone e texto */}
          <Zap className="mr-2 h-5 w-5" />
          {isPending ? "Enviando..." : "Enviar Mensagem"}
        </span>
      </Button>
      {state?.message && (
        <p className={`mt-4 text-center ${state.success ? "text-green-600" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  )
}
