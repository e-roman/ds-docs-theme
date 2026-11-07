import { SectionIndex } from "ds-docs-theme/docs/blocks"
import { foundations } from "@/lib/project"

export const metadata = { title: "Foundations · Acme Design System" }

export default function Page() {
  return <SectionIndex title="Foundations" intro="Color, tipografía, spacing y tokens de ejemplo." base="/foundations" group="foundations" items={foundations} />
}
