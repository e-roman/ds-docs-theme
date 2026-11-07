import { SectionSidebar } from "./section-sidebar"
import type { NavSection } from "../types"

/** Páginas de detalle de una sección: menú lateral pegado al margen izquierdo y el contenido a la derecha. */
export function SectionShell({ section, sections, children }: { section: string; sections: NavSection[]; children: React.ReactNode }) {
  const s = sections.find((x) => x.key === section)!
  return (
    <div className="flex w-full flex-col lg:flex-row">
      <SectionSidebar title={s.label} base={s.base} items={s.items} />
      <main className="min-w-0 flex-1 px-4 py-10 sm:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
