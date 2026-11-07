import { buildSearchIndex } from "ds-docs-theme/lib/search-index"
import type { SearchEntry } from "ds-docs-theme/lib/search"
import { allTokens, components, foundations, patterns } from "@/lib/project"

export function searchIndex(): SearchEntry[] {
  return buildSearchIndex({
    pages: [{ id: "p:get-started", type: "page", group: "Empezar", title: "Empezar", path: "/get-started", crumb: "Empezar", desc: "Qué es el sistema de diseño y cómo usarlo en un proyecto.", keywords: "instalar setup inicio" }],
    foundations, components, patterns, tokens: allTokens(),
  })
}
