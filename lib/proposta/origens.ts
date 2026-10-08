// Os dois instrutores viajam sempre juntos, cada um da sua cidade.
export type OrigemId = "poa" | "sjp"

export const ORIGENS: readonly { id: OrigemId; cidade: string; iata: string }[] = [
  { id: "poa", cidade: "Porto Alegre", iata: "POA" },
  { id: "sjp", cidade: "São José do Rio Preto", iata: "SJP" },
]

export const PESSOAS = ORIGENS.length
