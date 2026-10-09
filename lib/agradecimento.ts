// Mensagem de agradecimento do distribuidor à empresa que participou do treinamento.
export type AgradecimentoInput = {
  empresa: string
  responsavel?: string
  distribuidor?: string
  treinamento?: string
  data?: string
  participantes?: number
}

export function mensagemAgradecimento(i: AgradecimentoInput): string {
  const saud = (i.responsavel || "").trim()
  const dist = (i.distribuidor || "").trim()
  const titulo = (i.treinamento || "").trim()
  const data = (i.data || "").trim()
  const n = i.participantes || 0

  const doTreinamento = ["do treinamento", titulo ? `"${titulo}"` : "", data ? `em ${data}` : ""].filter(Boolean).join(" ")
  const linhas = [
    saud ? `Olá, ${saud}! Tudo bem?` : "Olá! Tudo bem?",
    dist ? `Aqui é ${dist}, distribuidor Moura, parceiro do Bateria 365.` : "Aqui é o distribuidor Moura, parceiro do Bateria 365.",
    "",
    `Passando para agradecer a participação da ${i.empresa} ${doTreinamento}! 🙏`,
  ]
  if (n > 0) linhas.push(n === 1 ? "Foi muito bom contar com a presença de vocês." : `Foi muito bom contar com a presença dos ${n} participantes da sua equipe.`)
  linhas.push(
    "Esperamos que o conteúdo ajude no dia a dia da loja e nas vendas.",
    "",
    "Conte sempre com a gente para o que precisar!",
    dist ? `Um abraço, ${dist}.` : "Um abraço!",
  )
  return linhas.join("\n")
}
