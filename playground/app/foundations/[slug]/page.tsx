import { notFound } from "next/navigation"
import { PageHeader } from "ds-docs-theme/docs/blocks"
import { FoundationView } from "ds-docs-theme/docs/foundation-views"
import { allTokens, foundations, links } from "@/lib/project"

export const generateStaticParams = () => foundations.map((f) => ({ slug: f.slug }))

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = foundations.find((f) => f.slug === slug)
  if (!item) notFound()
  return (
    <>
      <PageHeader title={item.title} description={item.description} links={{ github: links.tokensRepo, figma: links.figma }} />
      <FoundationView slug={slug} tokens={allTokens()} />
    </>
  )
}
