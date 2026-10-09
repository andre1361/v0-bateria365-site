// Mensagem de agradecimento da distribuidora ao cliente que participou do treinamento
// Bateria 365, com convite para a Academia Moura. Genérica de propósito: não cita
// empresa, data nem número de participantes. Sem emoji: o link do WhatsApp corrompe
// emojis (chegam como "�"). Assina com o vendedor da empresa quando houver; senão,
// com a equipe da distribuidora.
export const ACADEMIA_MOURA_URL = "https://ead.academiamoura.com.br/"

export type AgradecimentoInput = {
  distribuidor?: string
  vendedor?: string
}

export function mensagemAgradecimento(i: AgradecimentoInput): string {
  const dist = (i.distribuidor || "").trim()
  const vend = (i.vendedor || "").trim()

  const apresentacao = vend
    ? dist ? `Aqui é ${vend}, da equipe ${dist}.` : `Aqui é ${vend}, do seu distribuidor Moura.`
    : dist ? `Aqui é a equipe ${dist}.` : "Aqui é a equipe do seu distribuidor Moura."
  const assinatura = vend ? [vend, dist].filter(Boolean).join(" · ") : dist ? `Equipe ${dist}` : ""

  return [
    apresentacao,
    "",
    "Passando para agradecer a participação de vocês no treinamento Bateria 365!",
    "Foi muito bom contar com a presença da sua equipe.",
    "Esperamos que o conteúdo ajude no dia a dia da loja e nas vendas.",
    "",
    "Para dar continuidade nos conhecimentos, acessem a plataforma da *Academia Moura*, feita sob medida para ajudá-los nos desafios do dia a dia, conforme áreas e pessoas que deseja desenvolver na sua loja.",
    "",
    "Clique abaixo:",
    ACADEMIA_MOURA_URL,
    "",
    "Quando nossos parceiros crescem, a gente cresce junto.",
    "Conte sempre com a gente!",
    "",
    "Moura é Moura!",
    "",
    assinatura ? `Um abraço,\n${assinatura}` : "Um abraço!",
  ].join("\n")
}
