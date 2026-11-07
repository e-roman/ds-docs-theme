import type { NavItem, Token } from "../types"
import type { SearchEntry } from "./search"

/** Página donde se documenta un token, según su prefijo. */
function tokenPage(name: string): { path: string; crumb: string } {
  const f = (slug: string, label: string) => ({ path: `/foundations/${slug}`, crumb: `Foundations › ${label}` })
  if (name.startsWith("color-")) return f("color", "Color")
  if (name.startsWith("font-")) return f("typography", "Tipografía")
  if (name.startsWith("spacing-")) return f("spacing", "Spacing")
  if (name.startsWith("radius-")) return f("radius", "Radius")
  if (name.startsWith("shadow-")) return f("shadow", "Shadow")
  if (name.startsWith("border-width-")) return f("border", "Border")
  if (name.startsWith("opacity-")) return f("opacity", "Opacity")
  if (/^(duration|easing)-/.test(name)) return f("motion", "Motion")
  if (name.startsWith("size-")) return f("size", "Size")
  return f("tokens", "Design tokens")
}

/** Todas las páginas y tokens del sitio, para el buscador. `pages` son las páginas sueltas (ej. Empezar); el resto sale de la navegación y los tokens. Se genera al construir. */
export function buildSearchIndex({ pages, foundations, components, patterns, tokens }: { pages: SearchEntry[]; foundations: NavItem[]; components: NavItem[]; patterns: NavItem[]; tokens: Token[] }): SearchEntry[] {
  const out: SearchEntry[] = [...pages]
  for (const f of foundations) out.push({ id: `f:${f.slug}`, type: "page", group: "Foundations", title: f.title, path: `/foundations/${f.slug}`, crumb: `Foundations › ${f.title}`, desc: f.description })
  for (const c of components) out.push({ id: `c:${c.slug}`, type: "page", group: "Componentes", title: c.title, path: `/components/${c.slug}`, crumb: `Componentes › ${c.title}`, desc: c.description })
  for (const p of patterns) out.push({ id: `pt:${p.slug}`, type: "page", group: "Patrones", title: p.title, path: `/patterns/${p.slug}`, crumb: `Patrones › ${p.title}`, desc: p.description })
  for (const t of tokens) {
    const { path, crumb } = tokenPage(t.name)
    out.push({ id: `t:${t.name}`, type: "token", group: "Tokens", title: `--${t.name}`, path, crumb, value: t.resolved })
  }
  return out
}
