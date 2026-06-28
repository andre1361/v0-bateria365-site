import { PageHeader } from "../../page-header"
import { InvitesClient } from "./invites-client"

export default function ConvitesModulePage() {
  return (
    <>
      <PageHeader title="Convites" subtitle="Geração de convites" />
      <main style={{ flex: 1, padding: "26px 28px 56px" }}>
        <InvitesClient />
      </main>
    </>
  )
}
