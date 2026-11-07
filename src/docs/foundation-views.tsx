import { CopyToken } from "./copy-token"
import { Section } from "./blocks"
import { Card, CardContent } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { colorGroups, countsByFamily, rest, withPrefix } from "../lib/tokens"
import type { Token } from "../types"

/** Ajustes por proyecto: cómo nombra sus tokens. */
export type FoundationOptions = {
  /** Grupos de color semántico cuando se nombran `color-<grupo>-…` (surface, text, action…). Sin esto se usa `color-semantic-<grupo>-…`. */
  semanticColorGroups?: string[]
  /** Páginas definidas por el proyecto, por slug (reemplazan a la vista que trae el theme). */
  pages?: Record<string, FoundationSection[]>
}

/** Tipo de muestra de una sección de tokens. */
export type FoundationSample = "color" | "space" | "radius" | "shadow" | "border" | "opacity" | "duration" | "easing" | "font-family" | "font-weight" | "font-size" | "typography" | "none"

/**
 * Una sección de una página de foundations, definida por el proyecto:
 * - con `prefixes`: tabla de los tokens que empiezan con esos prefijos, con la muestra que corresponda;
 * - con `content`: contenido libre (texto, tablas, código);
 * - con `families: true`: cuántos tokens hay en cada familia.
 */
export type FoundationSection = {
  title: string
  intro?: React.ReactNode
  /** Prefijos de tokens: se listan en una tabla, en este orden. */
  prefixes?: string[]
  /** Nombres de token que no se muestran. */
  hide?: string[]
  /** Muestra de cada fila (por defecto, ninguna). */
  sample?: FoundationSample
  /** Contenido libre. Si existe, tiene prioridad sobre `prefixes`. */
  content?: React.ReactNode
  /** Tabla con la cantidad de tokens de cada familia. */
  families?: boolean
}

type V = { tokens: Token[]; options?: FoundationOptions }

/** Cuadrito de color con borde, para que se vean también los blancos. */
const Swatch = ({ color }: { color: string }) => <span className="inline-block size-8 shrink-0 rounded-md border" style={{ background: color }} />

/** Tabla genérica: muestra, nombre del token (copiable), valor resuelto y a qué apunta. */
export function TokenTable({ tokens, prefix, sample, wide }: { tokens: Token[]; prefix?: string; sample?: (t: Token) => React.ReactNode; /** Muestra ancha: las columnas se reparten solas en vez de tener ancho fijo. */ wide?: boolean }) {
  // si los tokens traen descripción se muestra «Uso»; si no, a qué token apuntan («Referencia»)
  const hasDesc = tokens.some((t) => t.desc)
  // la última columna solo aparece si hay algo que decir: una descripción o un alias (valor distinto del resuelto)
  const hasLast = hasDesc || tokens.some((t) => t.value !== t.resolved)
  // anchos fijos: las columnas coinciden de una tabla a otra (el texto largo de «Uso» baja de línea)
  return (
    <Table className={wide ? "" : "table-fixed"}>
      <TableHeader>
        <TableRow>
          {sample && <TableHead className={wide ? "" : "w-24"}>Muestra</TableHead>}
          <TableHead className={wide ? "min-w-48" : sample ? "w-[36%]" : "w-[40%]"}>Token</TableHead>
          <TableHead className={wide ? "min-w-36" : sample ? "w-[18%]" : "w-[20%]"}>Valor</TableHead>
          {hasLast && <TableHead className="hidden sm:table-cell">{hasDesc ? "Uso" : "Referencia"}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((t) => (
          <TableRow key={t.name}>
            {sample && <TableCell className="whitespace-normal!">{sample(t)}</TableCell>}
            <TableCell className="whitespace-normal!"><CopyToken name={t.name} label={prefix ? `--${prefix}${rest(t, prefix)}` : undefined} /></TableCell>
            <TableCell className="font-mono text-xs whitespace-normal! break-all">{t.resolved}</TableCell>
            {hasLast && (<TableCell className="hidden font-mono text-xs text-muted-foreground whitespace-normal! sm:table-cell">{hasDesc ? (t.desc ?? "") : t.value !== t.resolved ? t.value : "—"}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TokensView({ tokens }: V) {
  const counts = countsByFamily(tokens)
  return (
    <>
      <Section title="Arquitectura en capas" intro="Los tokens van de lo general a lo específico. Cada capa solo lee de la anterior, así un cambio de marca se hace en un lugar y llega a todos los componentes.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Primitive", "Los valores crudos: escalas de color, tamaños. Ej. --color-blue-brand-700."],
            ["Alias", "Nombres de marca sobre los primitivos. Ej. --color-brand-default."],
            ["Semantic", "Para qué se usa cada color. Ej. --color-semantic-text-link."],
          ].map(([t, d]) => (
            <Card key={t}><CardContent className="space-y-1"><p className="font-medium">{t}</p><p className="text-sm text-muted-foreground">{d}</p></CardContent></Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Regla: un componente usa tokens semánticos, no primitivos de color directos.</p>
      </Section>
      <Section title="Tokens por familia" intro="Cuántas variables hay en cada familia.">
        <Table>
          <TableHeader><TableRow><TableHead>Familia</TableHead><TableHead>Tokens</TableHead></TableRow></TableHeader>
          <TableBody>{counts.map(([f, n]) => <TableRow key={f}><TableCell className="font-mono text-xs">{f}-*</TableCell><TableCell>{n}</TableCell></TableRow>)}</TableBody>
        </Table>
      </Section>
    </>
  )
}

/** Una rampa de color: caja, paso y código debajo. */
function Ramp({ name, tokens, prefix }: { name: string; tokens: Token[]; prefix: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold capitalize">{name.replace(/-/g, " ")}</h3>
      {/* 11 columnas que reparten el 100% del ancho: las escalas completas llenan la fila */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 lg:grid-cols-11">
        {tokens.map((t) => (
          <div key={t.name} className="min-w-0">
            <span className="block h-16 rounded-lg border" style={{ background: t.resolved }} />
            <b className="mt-2 block text-xs">{rest(t, prefix)}</b>
            <code className="block break-all font-mono text-[11px] leading-tight text-muted-foreground">{t.resolved}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorView({ tokens, options }: V) {
  const { ramps, brand, semantic } = colorGroups(tokens, options?.semanticColorGroups)
  const custom = Boolean(options?.semanticColorGroups)
  return (
    <>
      <Section title="Primitivos" intro="Las escalas de la paleta. Son la materia prima: solo las usa la capa semántica.">
        <div className="space-y-8">
          {[...ramps].map(([ramp, list]) => <Ramp key={ramp} name={ramp} tokens={list} prefix={`color-${ramp}-`} />)}
        </div>
      </Section>
      {brand.length > 0 && (
        <Section title="Marca" intro="Alias de la escala de marca, más los estados por defecto, hover y sutil.">
          <TokenTable tokens={brand} sample={(t) => <Swatch color={t.resolved} />} />
        </Section>
      )}
      <Section title="Semánticos" intro="Colores con intención. Son los que usan los componentes. Hacé clic en un nombre para copiar la variable.">
        <div className="space-y-8">
          {[...semantic].map(([group, list]) => (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold capitalize">{group}</h3>
              <TokenTable tokens={list} prefix={custom ? `color-${group}-` : `color-semantic-${group}-`} sample={(t) => <Swatch color={t.resolved} />} />
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function TypographyView({ tokens }: V) {
  const sizes = withPrefix(tokens, "font-size-")
  return (
    <>
      <Section title="Familias" intro="Mulish para texto y títulos; JetBrains Mono para código.">
        <TokenTable tokens={withPrefix(tokens, "font-family-")} sample={(t) => <span className="text-xl" style={{ fontFamily: t.resolved }}>Aa</span>} />
      </Section>
      <Section title="Tamaños">
        <TokenTable tokens={sizes} sample={(t) => <span style={{ fontSize: t.resolved, lineHeight: 1.1 }}>Aa</span>} />
      </Section>
      <Section title="Pesos">
        <TokenTable tokens={withPrefix(tokens, "font-weight-")} sample={(t) => <span className="text-lg" style={{ fontWeight: Number(t.resolved) }}>Aa</span>} />
      </Section>
      <Section title="Interlineado">
        <TokenTable tokens={withPrefix(tokens, "font-line-height-")} />
      </Section>
    </>
  )
}

function SpacingView({ tokens }: V) {
  return (
    <Section title="Escala" intro="Base 4: cada paso es múltiplo de 4 px.">
      <TokenTable wide tokens={withPrefix(tokens, "spacing-")} sample={(t) => <span className="block h-3 rounded-sm bg-primary" style={{ width: t.resolved }} />} />
    </Section>
  )
}

function RadiusView({ tokens }: V) {
  return (
    <Section title="Escala" intro="De esquinas rectas a totalmente redondeadas.">
      <TokenTable tokens={withPrefix(tokens, "radius-")} sample={(t) => <span className="block size-10 border-2 border-primary bg-primary/10" style={{ borderRadius: t.resolved === "0" ? 0 : t.resolved }} />} />
    </Section>
  )
}

function ShadowView({ tokens }: V) {
  return (
    <Section title="Escala" intro="Sombras para separar superficies del fondo. El anillo de foco marca el elemento activo con el teclado.">
      <TokenTable tokens={withPrefix(tokens, "shadow-")} sample={(t) => <span className="block size-10 rounded-md bg-background" style={{ boxShadow: t.resolved }} />} />
    </Section>
  )
}

function BorderView({ tokens }: V) {
  return (
    <Section title="Grosores" intro="Para separar, marcar y enfocar.">
      <TokenTable tokens={withPrefix(tokens, "border-width-")} sample={(t) => <span className="block w-16 border-foreground" style={{ borderTopWidth: t.resolved, borderTopStyle: "solid" }} />} />
    </Section>
  )
}

function OpacityView({ tokens }: V) {
  return (
    <Section title="Escala" intro="Opacidades para estados deshabilitado, hover y overlay.">
      <TokenTable tokens={withPrefix(tokens, "opacity-")} sample={(t) => <span className="block size-10 rounded-md bg-primary" style={{ opacity: Number(t.resolved) }} />} />
    </Section>
  )
}

/** Barra que se desplaza al pasar el mouse por la fila, con la duración o la curva del token. */
const MotionBar = ({ duration, easing }: { duration?: string; easing?: string }) => (
  <span className="group block h-3 w-28 rounded-full bg-muted">
    <span
      className="block h-3 w-3 rounded-full bg-primary transition-transform group-hover:translate-x-[6.25rem]"
      style={{ transitionDuration: duration ?? "300ms", transitionTimingFunction: easing ?? "cubic-bezier(0.4, 0, 0.2, 1)" }}
    />
  </span>
)

function MotionView({ tokens }: V) {
  return (
    <>
      <Section title="Duración" intro="Cuánto tarda una transición. Pasá el mouse por la muestra para verla.">
        <TokenTable wide tokens={withPrefix(tokens, "duration-")} sample={(t) => <MotionBar duration={t.resolved} />} />
      </Section>
      <Section title="Curvas" intro="Cómo acelera y frena una transición. «standard» sirve para casi todo; «out» para lo que entra en pantalla.">
        <TokenTable wide tokens={withPrefix(tokens, "easing-")} sample={(t) => <MotionBar easing={t.resolved} />} />
      </Section>
    </>
  )
}

function SizeView({ tokens }: V) {
  return (
    <Section title="Tamaños" intro="Área mínima de toque, tamaños de ícono y anchos de contenedor.">
      <TokenTable tokens={withPrefix(tokens, "size-")} />
    </Section>
  )
}

/** Muestra de cada tipo y si necesita una columna ancha. */
const SAMPLES: Record<Exclude<FoundationSample, "none">, { render: (t: Token) => React.ReactNode; wide?: boolean }> = {
  color: { render: (t) => <Swatch color={t.resolved} /> },
  space: { wide: true, render: (t) => <span className="block h-3 rounded-sm bg-primary" style={{ width: t.resolved }} /> },
  radius: { render: (t) => <span className="block size-10 border-2 border-primary bg-primary/10" style={{ borderRadius: t.resolved === "0" ? 0 : t.resolved }} /> },
  shadow: { render: (t) => <span className="block size-10 rounded-md bg-background" style={{ boxShadow: t.resolved }} /> },
  border: { render: (t) => <span className="block w-16 border-foreground" style={{ borderTopWidth: t.resolved, borderTopStyle: "solid" }} /> },
  opacity: { render: (t) => <span className="block size-10 rounded-md bg-primary" style={{ opacity: Number(t.resolved) }} /> },
  duration: { wide: true, render: (t) => <MotionBar duration={t.resolved} /> },
  easing: { wide: true, render: (t) => <MotionBar easing={t.resolved} /> },
  "font-family": { render: (t) => <span className="text-xl" style={{ fontFamily: t.resolved }}>Aa</span> },
  "font-weight": { render: (t) => <span className="text-lg" style={{ fontWeight: Number(t.resolved) }}>Aa</span> },
  "font-size": { render: (t) => <span style={{ fontSize: t.resolved, lineHeight: 1.1 }}>Aa</span> },
  typography: { wide: true, render: (t) => <span className="block max-w-sm" style={{ font: t.resolved }}>La calidad que vos te merecés</span> },
}

/** Página de foundations armada con las secciones que define el proyecto. */
function SectionsView({ sections, tokens }: { sections: FoundationSection[]; tokens: Token[] }) {
  return (
    <>
      {sections.map((sec) => (
        <Section key={sec.title} title={sec.title} intro={sec.intro}>
          {sec.content ? sec.content : sec.families ? (
            <Table>
              <TableHeader><TableRow><TableHead>Familia</TableHead><TableHead>Tokens</TableHead></TableRow></TableHeader>
              <TableBody>{countsByFamily(tokens).map(([f, n]) => <TableRow key={f}><TableCell className="font-mono text-xs">{f}-*</TableCell><TableCell>{n}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : (
            (() => {
              const list = (sec.prefixes ?? []).flatMap((p) => withPrefix(tokens, p)).filter((t) => !sec.hide?.includes(t.name))
              const sm = sec.sample && sec.sample !== "none" ? SAMPLES[sec.sample] : undefined
              return <TokenTable tokens={list} sample={sm?.render} wide={sm?.wide} />
            })()
          )}
        </Section>
      ))}
    </>
  )
}

const VIEWS: Record<string, (p: V) => React.JSX.Element> = {
  tokens: TokensView, color: ColorView, typography: TypographyView, spacing: SpacingView,
  radius: RadiusView, shadow: ShadowView, border: BorderView, opacity: OpacityView, motion: MotionView, size: SizeView,
}

export const FoundationView = ({ slug, tokens, options }: { slug: string; tokens: Token[]; options?: FoundationOptions }) => {
  const custom = options?.pages?.[slug]
  if (custom) return <SectionsView sections={custom} tokens={tokens} />
  const View = VIEWS[slug]
  return View ? <View tokens={tokens} options={options} /> : null
}
