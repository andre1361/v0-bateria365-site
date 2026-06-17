"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function WhatsAppFloat() {
  const phoneNumber = "5551991484364"
  const message = "Gostaria de informações sobre o Bateria365"

  const [open, setOpen] = useState(false)
  const [rdm, setRdm] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const handleOpen = () => {
    setRdm("")
    setConfirmed(false)
    setOpen(true)
  }

  const handleContinue = () => {
    if (!rdm.trim() || !confirmed) return
    setOpen(false)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  const canContinue = rdm.trim().length > 0 && confirmed

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110"
        aria-label="Falar no WhatsApp"
      >
        <Image
          src="/images/whatsapp-icon.png"
          alt="WhatsApp Icon"
          width={24}
          height={24}
          className="h-6 w-6"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Antes de continuar</DialogTitle>
            <DialogDescription>
              Para acessar o suporte via WhatsApp, preencha as informações abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rdm">Qual RDM você está ligado?</Label>
              <Input
                id="rdm"
                placeholder="Digite o RDM"
                value={rdm}
                onChange={(e) => setRdm(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(val) => setConfirmed(val === true)}
                className="mt-0.5"
              />
              <Label htmlFor="confirm" className="leading-relaxed cursor-pointer">
                Confirmo que trabalho ou sou representante da distribuidora
              </Label>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              Ir para o WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
