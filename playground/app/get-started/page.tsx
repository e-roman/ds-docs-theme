import { PageContainer, PageHeader, Section } from "ds-docs-theme/docs/blocks"
import { links } from "@/lib/project"

export const metadata = { title: "Empezar · Acme Design System" }

export default function GetStarted() {
  return (
    <PageContainer>
      <PageHeader title="Empezar" description="Playground del theme: así se ve la documentación con datos de ejemplo, antes de cargarle la data de cada proyecto." links={{ github: links.tokensRepo, figma: links.figma }} />
      <Section title="Qué es esto">
        <p className="max-w-2xl text-sm">El theme define el diseño: header, menús, tarjetas, tablas, pestañas, buscador y vistas de foundations, componentes y patrones. Cada proyecto aporta su marca, sus tokens y sus piezas.</p>
      </Section>
    </PageContainer>
  )
}
