import { PageHeader } from "../../../../page-header"
import { requireAdmin } from "../../../../guard"
import { obterConfiguracoes } from "../server"
import { ConfigClient } from "./config-client"

export default async function ConfiguracoesPropostasPage() {
  await requireAdmin()
  const cfg = await obterConfiguracoes()
  return (
    <>
      <PageHeader title="Configurações das propostas" subtitle="Valores padrão de cada nova proposta" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <ConfigClient parametros={cfg.parametros} validadeDias={cfg.validadeDias} />
      </main>
    </>
  )
}
