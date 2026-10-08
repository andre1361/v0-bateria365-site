import type { Parametros } from "./calculo"

// Valem enquanto o super admin não gravar outros em Propostas → Configurações.
export const PADROES: { parametros: Parametros; validadeDias: number } = {
  parametros: { hotelDiaria: 35000, alimentacaoDia: 20000, uberFixo: 20000, honorario: 1200000, acrescimoPct: 0 },
  validadeDias: 10,
}
