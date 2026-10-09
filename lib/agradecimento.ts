// Mensagem de agradecimento da distribuidora ao cliente que participou do treinamento
// Bateria 365. Genérica de propósito: não cita empresa, data nem número de participantes.
// Assina com o vendedor da empresa quando houver; senão, com a equipe da distribuidora.
export type AgradecimentoInput = {
  responsavel?: string
  distribuidor?: string
  vendedor?: string
}

export function mensagemAgradecimento(i: AgradecimentoInput): string {
  const saud = (i.responsavel || "").trim()
  const dist = (i.distribuidor || "").trim()
  const vend = (i.vendedor || "").trim()

  const apresentacao = vend
    ? dist ? `Aqui é ${vend}, da equipe ${dist}.` : `Aqui é ${vend}, do seu distribuidor Moura.`
    : dist ? `Aqui é a equipe ${dist}.` : "Aqui é a equipe do seu distribuidor Moura."
  const assinatura = vend ? [vend, dist].filter(Boolean).join(" · ") : dist ? `Equipe ${dist}` : ""

  return [
    saud ? `Olá, ${saud}! Tudo bem?` : "Olá! Tudo bem?",
    apresentacao,
    "",
    "Passando para agradecer a participação de vocês no treinamento Bateria 365! 🙏",
    "Foi muito bom contar com a presença da sua equipe.",
    "Esperamos que o conteúdo ajude no dia a dia da loja e nas vendas.",
    "",
    "Quando nossos parceiros crescem, a gente cresce junto. 💪",
    "Conte sempre com a gente!",
    "",
    assinatura ? `Um abraço,\n${assinatura}` : "Um abraço!",
  ].join("\n")
}
