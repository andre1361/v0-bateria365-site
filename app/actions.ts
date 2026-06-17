"use server"

import { z } from "zod"

// Esquema de validação para os dados do formulário
const contactFormSchema = z.object({
  distributorName: z.string().min(1, "O nome do distribuidor é obrigatório."),
  email: z.string().email("E-mail inválido.").min(1, "O e-mail é obrigatório."),
  phone: z.string().min(1, "O telefone é obrigatório."),
  city: z.string().min(1, "A cidade é obrigatória."),
})

export async function submitContactForm(prevState: any, formData: FormData) {
  // Simula um atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const data = {
    distributorName: formData.get("distributorName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
  }

  // Valida os dados do formulário
  const parsed = contactFormSchema.safeParse(data)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      success: false,
      message: "Erro de validação. Verifique os campos.",
      errors: errors,
    }
  }

  // Dados validados
  const { distributorName, email, phone, city } = parsed.data // Adicionado 'city' aqui

  // Prepara o corpo da requisição para o webhook
  const webhookBody = {
    Nome: distributorName,
    Email: email,
    Telefone: phone,
    Cidade: city, // Adicionado o campo de cidade
    "Telefone da Empresa": "51991484364", // Valor fixo conforme solicitado
    form_id: "bat365_01",
    form_name: "bateria_365",
  }

  try {
    const response = await fetch("https://webhook.rac7.com.br/webhook/recebe-lead-bateria365", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookBody),
    })

    if (!response.ok) {
      // Se a resposta não for OK (status 2xx), lança um erro
      const errorData = await response.json()
      console.error("Erro ao enviar para o webhook:", response.status, errorData)
      return {
        success: false,
        message: `Erro ao enviar sua mensagem. Código: ${response.status}.`,
        errors: {},
      }
    }

    // Se a requisição for bem-sucedida
    console.log("Dados enviados com sucesso para o webhook:", webhookBody)
    return {
      success: true,
      message: "Sua mensagem foi enviada com sucesso! Em breve entraremos em contato.",
      errors: {},
    }
  } catch (error) {
    console.error("Erro de rede ou inesperado ao enviar para o webhook:", error)
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao enviar sua mensagem. Tente novamente.",
      errors: {},
    }
  }
}
