import { SectionIndex } from "ds-docs-theme/docs/blocks"
import { patterns } from "@/lib/project"

export const metadata = { title: "Patrones · Acme Design System" }

export default function Page() {
  return <SectionIndex title="Patrones" intro="Bloques compuestos de ejemplo." base="/patterns" group="patterns" items={patterns} />
}
