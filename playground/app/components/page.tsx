import { SectionIndex } from "ds-docs-theme/docs/blocks"
import { components } from "@/lib/project"

export const metadata = { title: "Componentes · Acme Design System" }

export default function Page() {
  return <SectionIndex title="Componentes" intro="Piezas de ejemplo dibujadas directo en la página (modo inline)." base="/components" group="components" items={components} />
}
