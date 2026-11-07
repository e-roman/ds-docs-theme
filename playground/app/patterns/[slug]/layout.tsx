import { SectionShell } from "ds-docs-theme/docs/section-shell"
import { sections } from "@/lib/project"

export default function PatternsLayout({ children }: { children: React.ReactNode }) {
  return <SectionShell section="patterns" sections={sections}>{children}</SectionShell>
}
