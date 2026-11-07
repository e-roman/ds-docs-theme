import path from "node:path"
import { inlinePreviews } from "ds-docs-theme/lib/previews"
import { readTokens } from "ds-docs-theme/lib/tokens"
import type { NavItem, NavSection, Piece } from "ds-docs-theme/types"
import { ShoppingCart } from "lucide-react"
import { Badge } from "ds-docs-theme/ui/badge"
import { Button } from "ds-docs-theme/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ds-docs-theme/ui/card"

/*
 * DATA DEL PROYECTO (ficticio: «Acme»). En un proyecto real este archivo trae su propia marca, navegación, tokens y piezas.
 * El theme no sabe nada de esto: lo recibe por props desde las páginas de app/.
 */

export const brand = { name: "Acme", tagline: "Design System", logo: { src: "/logo.svg", width: 112, height: 28 } }
export const links = { repo: "https://github.com/acme/ui", tokensRepo: "https://github.com/acme/tokens", figma: "https://www.figma.com/design/acme" }

/** CSS de tokens del proyecto (en uno real: node_modules/<paquete-de-tokens>/dist/tokens.css). */
export const TOKENS_CSS = path.join(process.cwd(), "playground/data/tokens.css")
export const allTokens = () => readTokens(TOKENS_CSS)

/** Previews en modo inline: cada vista trae su componente ya armado. */
export const preview = inlinePreviews({ repo: links.repo })

export const topNav = [
  { href: "/get-started", label: "Empezar" },
  { href: "/foundations", label: "Foundations" },
  { href: "/components", label: "Componentes" },
  { href: "/patterns", label: "Patrones" },
]

export const foundations: NavItem[] = [
  { slug: "tokens", title: "Design tokens", description: "Las decisiones de diseño como variables, en capas." },
  { slug: "color", title: "Color", description: "Paleta de marca y colores con intención: superficie, texto, borde y feedback." },
  { slug: "typography", title: "Tipografía", description: "Familias, pesos, tamaños e interlineados." },
  { slug: "spacing", title: "Spacing", description: "Escala base 4 para espacios." },
  { slug: "radius", title: "Radius", description: "Esquinas rectas, suaves o totalmente redondeadas." },
  { slug: "shadow", title: "Shadow", description: "Sombras para separar superficies del fondo y el anillo de foco." },
  { slug: "border", title: "Border", description: "Grosores de borde." },
  { slug: "opacity", title: "Opacity", description: "Opacidades para estados deshabilitado, hover y overlay." },
  { slug: "motion", title: "Motion", description: "Cuánto dura y cómo se mueve cada transición." },
  { slug: "size", title: "Size", description: "Tamaños mínimos de toque, íconos y contenedores." },
]

export const pieces: Piece[] = [
  {
    slug: "button", group: "components", title: "Button", file: "src/button.tsx",
    description: "Acción principal o secundaria de una pantalla.",
    docsId: "",
    anatomy: {
      story: "button",
      parts: [
        { n: 1, label: "Contenedor", selector: "[data-slot=button]", side: "top" },
        { n: 2, label: "Ícono", selector: "svg", side: "bottom", pct: 20 },
        { n: 3, label: "Etiqueta", selector: "[data-part=label]", side: "bottom", pct: 80 },
      ],
      node: <Button><ShoppingCart /><span data-part="label">Agregar al carrito</span></Button>,
    },
    stories: [
      { label: "Primario", id: "button-primary", node: <div className="flex flex-wrap gap-3"><Button>Comprar ahora</Button><Button size="sm">Pequeño</Button></div> },
      { label: "Secundario", id: "button-secondary", node: <div className="flex flex-wrap gap-3"><Button variant="secondary">Ver detalle</Button><Button variant="outline">Cancelar</Button></div> },
      { label: "Estados", id: "button-states", node: <div className="flex flex-wrap gap-3"><Button disabled>Deshabilitado</Button><Button variant="destructive">Eliminar</Button><Button variant="ghost">Ghost</Button></div> },
    ],
    props: [
      ["variant", "default | secondary | outline | ghost | destructive", "Estilo visual del botón."],
      ["size", "sm | default | lg | icon", "Tamaño del botón."],
      ["disabled", "boolean", "Deshabilita la acción."],
    ],
    use: ["Para la acción principal de una pantalla o formulario.", "Para acciones secundarias, con la variante secundaria u outline."],
    avoid: ["Más de un botón primario por pantalla.", "Para navegar entre páginas: usa un enlace."],
    practices: [
      { ok: true, title: "Un solo botón primario", text: "La acción principal destaca y el resto acompaña.", storyId: "p1", node: <div className="flex gap-3"><Button>Guardar</Button><Button variant="outline">Cancelar</Button></div> },
      { ok: false, title: "Varios botones primarios", text: "Si todos compiten, ninguno guía al usuario.", storyId: "p2", node: <div className="flex gap-3"><Button>Guardar</Button><Button>Cancelar</Button></div> },
    ],
    a11y: ["Es un `button` nativo: se activa con teclado y lo anuncian los lectores de pantalla."],
    keyboard: [{ keys: ["Enter", "Espacio"], action: "Activa el botón." }],
    history: [{ date: "2026-11-07", text: "Pieza de ejemplo del playground." }],
  },
  {
    slug: "badge", group: "components", title: "Badge", file: "src/badge.tsx",
    description: "Etiqueta corta de estado o cantidad.",
    docsId: "",
    stories: [{ label: "Variantes", id: "badge-variants", node: <div className="flex flex-wrap gap-3"><Badge>Nuevo</Badge><Badge variant="secondary">Borrador</Badge><Badge variant="outline">Outline</Badge><Badge variant="destructive">Agotado</Badge></div> }],
    props: [["variant", "default | secondary | outline | destructive", "Estilo visual."]],
    use: ["Para marcar el estado de un elemento.", "Para mostrar una cantidad corta."],
    avoid: ["Para textos largos o frases completas."],
  },
  {
    slug: "product-card", group: "patterns", cat: "Catálogo", title: "Tarjeta de producto", file: "src/product-card.tsx",
    description: "Producto con nombre, estado, precio y acción de compra.",
    docsId: "",
    stories: [{
      label: "Default", id: "product-card-default",
      node: (
        <Card className="max-w-xs">
          <CardHeader>
            <Badge className="w-fit">Nuevo</Badge>
            <CardTitle>Producto de ejemplo</CardTitle>
            <CardDescription>Descripción corta del producto.</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">$ 4.990</CardContent>
          <CardFooter><Button className="w-full">Agregar al carrito</Button></CardFooter>
        </Card>
      ),
    }],
    props: [],
    use: ["En listados y grillas de catálogo."],
    avoid: ["Como detalle completo de producto: usa una página propia."],
  },
]

export const piecesOf = (group: Piece["group"]) => pieces.filter((p) => p.group === group).sort((a, b) => a.title.localeCompare(b.title))
export const pieceBySlug = (group: Piece["group"], slug: string) => pieces.find((p) => p.group === group && p.slug === slug)

const toNav = (group: Piece["group"]): NavItem[] => piecesOf(group).map((p) => ({ slug: p.slug, title: p.title, description: p.description, cat: p.cat }))
export const components = toNav("components")
export const patterns = toNav("patterns")

export const sections: NavSection[] = [
  { key: "foundations", label: "Foundations", base: "/foundations", items: foundations },
  { key: "components", label: "Componentes", base: "/components", items: components },
  { key: "patterns", label: "Patrones", base: "/patterns", items: patterns },
]
