import type { ReactNode } from "react"

/** Un design token leído del CSS del proyecto. */
export type Token = {
  /** Nombre sin "--", ej. "color-brand-700". */
  name: string
  /** Valor tal como está en el CSS (puede ser var(--otro)). */
  value: string
  /** Valor final, resolviendo referencias. */
  resolved: string
  /** Descripción del token (el comentario de su línea en el CSS), si la tiene. */
  desc?: string
}

/** Entrada del menú lateral de una sección. */
export type NavItem = { slug: string; title: string; description: string; cat?: string }

/** Sección con menú lateral (Foundations, Componentes, Patrones…). */
export type NavSection = { key: string; label: string; base: string; items: NavItem[] }

export type Prop = [name: string, type: string, desc: string, required?: boolean]
/** Una parte del componente. `selector` se busca dentro de la story; `side` es de qué lado se dibuja el número; `pct` lo mueve a lo largo de ese borde (0–100, por defecto 50). */
export type AnatomyPart = { n: number; label: string; selector: string; note?: string; side: "top" | "bottom" | "left" | "right"; pct?: number }
/** Anatomía interactiva: una story de Storybook y sus partes. */
export type Anatomy = { story: string; /** Ancho máximo del marco en px. */ width?: number; parts: AnatomyPart[]; /** Modo «inline»: el componente ya armado, sin iframe. Los `selector` de las partes se buscan dentro de él. */ node?: ReactNode }
/** `width`: ancho máximo del marco en px; las stories mobile se muestran en un marco angosto. */
export type Story = { label: string; id: string; width?: number; /** Texto bajo la vista: cuándo usar esa variante. */ caption?: string; /** Fondo oscuro: para vistas pensadas para fotos o superficies oscuras. */ dark?: boolean; /** Modo «inline»: el componente ya armado, se dibuja sin iframe. */ node?: ReactNode }
/** Vistas agrupadas por una propiedad (Variante, Tamaño, Estado…): cada grupo es un bloque con sus pestañas. */
export type StoryGroup = { title: string; intro?: string; stories: Story[] }
/** Un propósito de la pieza: título corto y una frase. */
export type Purpose = { title: string; text: string }
/** Cambio propio de la pieza. Lo que va entre `backticks` se muestra como código. */
export type HistoryEntry = { date: string; text: string }
/** Ejemplo «sí / no» con una vista previa (story en iframe o `node` en modo inline). */
export type Practice = { ok: boolean; title: string; text?: string; storyId: string; /** Modo «inline»: la vista ya armada, sin iframe. */ node?: ReactNode }

export type Piece = {
  slug: string
  group: "components" | "patterns"
  /** Categoría del sidebar de patrones. */
  cat?: string
  title: string
  description: string
  /** Archivo en src/components de la tienda. */
  file: string
  /** id de la página Docs en Storybook. */
  docsId: string
  /** Alto del preview en px (por defecto 200). */
  previewHeight?: number
  stories: Story[]
  /** Alternativa a `stories`: vistas agrupadas por propiedad. Si existe, tiene prioridad. */
  groups?: StoryGroup[]
  /** Para qué sirve la pieza (sección «Propósito», antes de la anatomía). */
  purpose?: Purpose[]
  /** Prefijos de tokens de la pieza (ej. `button-`): se listan en la sección «Tokens», leídos en vivo. */
  tokenPrefixes?: string[]
  /** Encabezado de la primera columna del historial (por defecto «Fecha»; puede ser «Versión de tokens»). */
  historyColumn?: string
  /** Texto corto para menús y tarjetas del índice; si falta se usa `description`. */
  summary?: string
  /** Partes del componente, con un número cada una; abren el inspector (solo las que existen en el código). */
  anatomy?: Anatomy
  props: Prop[]
  use: string[]
  avoid: string[]
  /** Ejemplos «sí / no» con preview (pestaña Uso). */
  practices?: Practice[]
  /** Accesibilidad. Solo se escribe lo verificado en el código; si no hay nada, la pestaña no se muestra. */
  /** «Rol y estructura»: nombres accesibles, roles, estados. */
  a11y?: string[]
  /** «Teclado»: teclas y su acción. */
  keyboard?: { keys: string[]; action: string }[]
  /** «Contraste»: pares de tokens de color tal como los aplica el CSS de la tienda. `min`: 4.5 para texto (por defecto) o 3 para íconos. */
  contrast?: { element: string; fg: string; bg: string; min?: number }[]
  /** Cambios propios de la pieza, el más nuevo primero (pestaña Historial). */
  history?: HistoryEntry[]
}

/**
 * Cómo se muestran las vistas previas de las piezas.
 * - `storybook`: iframes a un Storybook publicado (sirve para tiendas con CSS global que no se puede mezclar con la documentación).
 * - `inline`: el componente real se dibuja directo en la caja (más rápido); el proyecto entrega cada vista en `Story.node`.
 */
export type PreviewAdapter = {
  mode: "storybook" | "inline"
  /** Story embebida (mismo origen). */
  liveUrl: (id: string) => string
  /** Story en Storybook, en pestaña nueva. */
  storyUrl: (id: string) => string
  /** Página Docs de la pieza en Storybook. */
  docsUrl: (id: string) => string
  /** Código de la pieza en el repositorio. */
  sourceUrl: (file: string) => string
}

/** Enlaces externos de las páginas (los que no existen no se muestran). */
export type ExternalLinks = { github?: string; storybook?: string; figma?: string }
