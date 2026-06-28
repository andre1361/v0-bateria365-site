import { PageHeader } from "../../page-header"
import { InvitesClient } from "./invites-client"

export default function ConvitesModulePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader title="Convites" subtitle="Geração de convites" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <InvitesClient />
      </div>
    </div>
  )
}
