// Aeroportos brasileiros com voo comercial regular. Nas cidades com mais de um,
// o primeiro listado é o sugerido (ex.: Congonhas antes de Guarulhos).
export type Aeroporto = { iata: string; nome: string; cidade: string; uf: string }

const a = (iata: string, nome: string, cidade: string, uf: string): Aeroporto => ({ iata, nome, cidade, uf })

export const AEROPORTOS: readonly Aeroporto[] = [
  a("RBR", "Aeroporto Internacional Plácido de Castro", "Rio Branco", "AC"),
  a("CZS", "Aeroporto Internacional de Cruzeiro do Sul", "Cruzeiro do Sul", "AC"),
  a("MCZ", "Aeroporto Internacional Zumbi dos Palmares", "Maceió", "AL"),
  a("MAO", "Aeroporto Internacional Eduardo Gomes", "Manaus", "AM"),
  a("TBT", "Aeroporto Internacional de Tabatinga", "Tabatinga", "AM"),
  a("MCP", "Aeroporto Internacional de Macapá", "Macapá", "AP"),
  a("SSA", "Aeroporto Internacional de Salvador", "Salvador", "BA"),
  a("IOS", "Aeroporto Jorge Amado", "Ilhéus", "BA"),
  a("BPS", "Aeroporto de Porto Seguro", "Porto Seguro", "BA"),
  a("VDC", "Aeroporto Glauber Rocha", "Vitória da Conquista", "BA"),
  a("BRA", "Aeroporto de Barreiras", "Barreiras", "BA"),
  a("LEC", "Aeroporto Horácio de Mattos", "Lençóis", "BA"),
  a("FOR", "Aeroporto Internacional Pinto Martins", "Fortaleza", "CE"),
  a("JDO", "Aeroporto Orlando Bezerra de Menezes", "Juazeiro do Norte", "CE"),
  a("BSB", "Aeroporto Internacional Presidente Juscelino Kubitschek", "Brasília", "DF"),
  a("VIX", "Aeroporto Eurico de Aguiar Salles", "Vitória", "ES"),
  a("GYN", "Aeroporto Internacional Santa Genoveva", "Goiânia", "GO"),
  a("RVD", "Aeroporto de Rio Verde", "Rio Verde", "GO"),
  a("CLV", "Aeroporto Nelson Rodrigues Guimarães", "Caldas Novas", "GO"),
  a("SLZ", "Aeroporto Internacional Marechal Cunha Machado", "São Luís", "MA"),
  a("IMP", "Aeroporto Prefeito Renato Moreira", "Imperatriz", "MA"),
  a("CNF", "Aeroporto Internacional de Confins", "Belo Horizonte", "MG"),
  a("PLU", "Aeroporto da Pampulha", "Belo Horizonte", "MG"),
  a("UDI", "Aeroporto Ten. Cel. Aviador César Bombonato", "Uberlândia", "MG"),
  a("UBA", "Aeroporto Mário de Almeida Franco", "Uberaba", "MG"),
  a("MOC", "Aeroporto Mário Ribeiro", "Montes Claros", "MG"),
  a("IZA", "Aeroporto Regional da Zona da Mata", "Juiz de Fora", "MG"),
  a("IPN", "Aeroporto do Vale do Aço", "Ipatinga", "MG"),
  a("GVR", "Aeroporto Coronel Altino Machado", "Governador Valadares", "MG"),
  a("VAG", "Aeroporto de Varginha", "Varginha", "MG"),
  a("CGR", "Aeroporto Internacional de Campo Grande", "Campo Grande", "MS"),
  a("DOU", "Aeroporto de Dourados", "Dourados", "MS"),
  a("CMG", "Aeroporto Internacional de Corumbá", "Corumbá", "MS"),
  a("TJL", "Aeroporto de Três Lagoas", "Três Lagoas", "MS"),
  a("CGB", "Aeroporto Internacional Marechal Rondon", "Cuiabá", "MT"),
  a("OPS", "Aeroporto de Sinop", "Sinop", "MT"),
  a("ROO", "Aeroporto de Rondonópolis", "Rondonópolis", "MT"),
  a("AFL", "Aeroporto de Alta Floresta", "Alta Floresta", "MT"),
  a("BEL", "Aeroporto Internacional de Belém", "Belém", "PA"),
  a("STM", "Aeroporto de Santarém", "Santarém", "PA"),
  a("MAB", "Aeroporto de Marabá", "Marabá", "PA"),
  a("ATM", "Aeroporto de Altamira", "Altamira", "PA"),
  a("CKS", "Aeroporto de Carajás", "Parauapebas", "PA"),
  a("JPA", "Aeroporto Internacional Presidente Castro Pinto", "João Pessoa", "PB"),
  a("CPV", "Aeroporto Presidente João Suassuna", "Campina Grande", "PB"),
  a("REC", "Aeroporto Internacional do Recife", "Recife", "PE"),
  a("PNZ", "Aeroporto Senador Nilo Coelho", "Petrolina", "PE"),
  a("THE", "Aeroporto Senador Petrônio Portella", "Teresina", "PI"),
  a("PHB", "Aeroporto Internacional de Parnaíba", "Parnaíba", "PI"),
  a("CWB", "Aeroporto Internacional Afonso Pena", "Curitiba", "PR"),
  a("LDB", "Aeroporto Governador José Richa", "Londrina", "PR"),
  a("MGF", "Aeroporto Regional de Maringá", "Maringá", "PR"),
  a("IGU", "Aeroporto Internacional de Foz do Iguaçu", "Foz do Iguaçu", "PR"),
  a("CAC", "Aeroporto de Cascavel", "Cascavel", "PR"),
  a("PGZ", "Aeroporto de Ponta Grossa", "Ponta Grossa", "PR"),
  a("TOW", "Aeroporto de Toledo", "Toledo", "PR"),
  a("SDU", "Aeroporto Santos Dumont", "Rio de Janeiro", "RJ"),
  a("GIG", "Aeroporto Internacional do Galeão", "Rio de Janeiro", "RJ"),
  a("CFB", "Aeroporto Internacional de Cabo Frio", "Cabo Frio", "RJ"),
  a("MEA", "Aeroporto de Macaé", "Macaé", "RJ"),
  a("CAW", "Aeroporto Bartolomeu Lysandro", "Campos dos Goytacazes", "RJ"),
  a("NAT", "Aeroporto Internacional de Natal", "Natal", "RN"),
  a("MVF", "Aeroporto de Mossoró", "Mossoró", "RN"),
  a("PVH", "Aeroporto Internacional Governador Jorge Teixeira", "Porto Velho", "RO"),
  a("JPR", "Aeroporto de Ji-Paraná", "Ji-Paraná", "RO"),
  a("BVH", "Aeroporto de Vilhena", "Vilhena", "RO"),
  a("OAL", "Aeroporto de Cacoal", "Cacoal", "RO"),
  a("BVB", "Aeroporto Internacional de Boa Vista", "Boa Vista", "RR"),
  a("POA", "Aeroporto Internacional Salgado Filho", "Porto Alegre", "RS"),
  a("CXJ", "Aeroporto Hugo Cantergiani", "Caxias do Sul", "RS"),
  a("PFB", "Aeroporto Lauro Kurtz", "Passo Fundo", "RS"),
  a("PET", "Aeroporto Internacional de Pelotas", "Pelotas", "RS"),
  a("RIA", "Aeroporto de Santa Maria", "Santa Maria", "RS"),
  a("GEL", "Aeroporto de Santo Ângelo", "Santo Ângelo", "RS"),
  a("URG", "Aeroporto de Uruguaiana", "Uruguaiana", "RS"),
  a("FLN", "Aeroporto Internacional de Florianópolis", "Florianópolis", "SC"),
  a("NVT", "Aeroporto Internacional de Navegantes", "Navegantes", "SC"),
  a("JOI", "Aeroporto Lauro Carneiro de Loyola", "Joinville", "SC"),
  a("XAP", "Aeroporto Serafin Enoss Bertaso", "Chapecó", "SC"),
  a("JJG", "Aeroporto Regional Sul (Criciúma/Tubarão)", "Jaguaruna", "SC"),
  a("AJU", "Aeroporto Santa Maria", "Aracaju", "SE"),
  a("CGH", "Aeroporto de Congonhas", "São Paulo", "SP"),
  a("GRU", "Aeroporto Internacional de Guarulhos", "São Paulo", "SP"),
  a("VCP", "Aeroporto Internacional de Viracopos", "Campinas", "SP"),
  a("RAO", "Aeroporto Leite Lopes", "Ribeirão Preto", "SP"),
  a("SJP", "Aeroporto Prof. Eribelto Manoel Reino", "São José do Rio Preto", "SP"),
  a("SJK", "Aeroporto Prof. Urbano Ernesto Stumpf", "São José dos Campos", "SP"),
  a("PPB", "Aeroporto de Presidente Prudente", "Presidente Prudente", "SP"),
  a("JTC", "Aeroporto Bauru-Arealva", "Bauru", "SP"),
  a("MII", "Aeroporto de Marília", "Marília", "SP"),
  a("ARU", "Aeroporto de Araçatuba", "Araçatuba", "SP"),
  a("PMW", "Aeroporto de Palmas", "Palmas", "TO"),
  a("AUX", "Aeroporto de Araguaína", "Araguaína", "TO"),
]

export function normalizarTexto(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/\s+/g, " ")
    .trim()
}

export function aeroportoPorIata(iata: string): Aeroporto | undefined {
  const c = (iata || "").trim().toUpperCase()
  return AEROPORTOS.find((x) => x.iata === c)
}

// Código exato primeiro, depois cidades que começam com o texto, depois qualquer
// correspondência em cidade, nome ou código. Mantém a ordem da lista no empate.
export function buscarAeroportos(q: string, limite = 8): Aeroporto[] {
  const n = normalizarTexto(q)
  if (!n) return []
  const pontos = (x: Aeroporto) => {
    if (x.iata.toLowerCase() === n) return 0
    if (normalizarTexto(x.cidade).startsWith(n)) return 1
    const alvo = normalizarTexto(`${x.cidade} ${x.nome} ${x.iata}`)
    return alvo.includes(n) ? 2 : -1
  }
  return AEROPORTOS.map((x, i) => ({ x, i, p: pontos(x) }))
    .filter((r) => r.p >= 0)
    .sort((r1, r2) => r1.p - r2.p || r1.i - r2.i)
    .slice(0, limite)
    .map((r) => r.x)
}

// A cidade do distribuidor é texto livre ("Campinas - SP", "Ribeirão Preto/SP").
// Tenta o texto inteiro ("Ji-Paraná"), depois corta antes de " - ", "/", "," ou "("
// ("Ji-Paraná - RO") e por fim em qualquer hífen ("Campinas-SP").
export function sugerirAeroporto(cidade: string): Aeroporto | null {
  const inteiro = normalizarTexto(cidade)
  if (!inteiro) return null
  const candidatos = [inteiro, inteiro.split(/\s+-\s+|[/,(]/)[0], inteiro.split(/[-/,(]/)[0]].map(normalizarTexto)
  for (const alvo of candidatos) {
    const achou = AEROPORTOS.find((x) => normalizarTexto(x.cidade) === alvo)
    if (achou) return achou
  }
  return null
}
