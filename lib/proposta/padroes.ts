import type { Parametros } from "./calculo"

export type Configuracoes = { parametros: Parametros; validadeDias: number; visitasTecnicas: number }

// Valem enquanto o super admin não gravar outros em Propostas → Configurações.
export const PADROES: Configuracoes = {
  parametros: { hotelDiaria: 35000, alimentacaoDia: 20000, uberFixo: 20000, honorario: 1200000, acrescimoPct: 0 },
  validadeDias: 10,
  visitasTecnicas: 3,
}

export const MAX_VISITAS = 20
