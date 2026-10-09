// Mensagem de agradecimento da distribuidora à empresa que participou do treinamento.
// Assina com o vendedor da empresa quando houver; senão, com a equipe da distribuidora.
export type AgradecimentoInput = {
  empresa: string
  responsavel?: string
  distribuidor?: string
  vendedor?: string
  treinamento?: string
  data?: string
  participantes?: number
}

export function mensagemAgradecimento(i: AgradecimentoInput): string {
  const saud = (i.responsavel || "").trim()
  const dist = (i.distribuidor || "").trim()
  const vend = (i.vendedor || "").trim()
  const titulo = (i.treinamento || "").trim()
  const data = (i.data || "").trim()
  const n = i.participantes || 0

  const apresentacao = vend
    ? dist ? `Aqui é ${vend}, da equipe ${dist}.` : `Aqui é ${vend}, do seu distribuidor Moura.`
    : dist ? `Aqui é a equipe ${dist}.` : "Aqui é a equipe do seu distribuidor Moura."
  const assinatura = vend ? [vend, dist].filter(Boolean).join(" · ") : dist ? `Equipe ${dist}` : ""
  const noTreinamento = ["no treinamento", titulo ? `"${titulo}"` : "", data ? `em ${data}` : ""].filter(Boolean).join(" ")

  const linhas = [
    saud ? `Olá, ${saud}! Tudo bem?` : "Olá! Tudo bem?",
    apresentacao,
    "",
    `Passando para agradecer a participação da ${i.empresa} ${noTreinamento}! 🙏`,
  ]
  if (n > 0) linhas.push(n === 1 ? "Foi muito bom contar com a presença de vocês." : `Foi muito bom contar com a presença dos ${n} participantes da sua equipe.`)
  linhas.push(
    "Esperamos que o conteúdo ajude no dia a dia da loja e nas vendas.",
    "",
    "Quando nossos parceiros crescem, a gente cresce junto. 💪",
    "Conte sempre com a gente!",
    "",
    assinatura ? `Um abraço,\n${assinatura}` : "Um abraço!",
  )
  return linhas.join("\n")
}
