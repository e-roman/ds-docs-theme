import { SectionShell } from "ds-docs-theme/docs/section-shell"
import { sections } from "@/lib/project"

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <SectionShell section="components" sections={sections}>{children}</SectionShell>
}
