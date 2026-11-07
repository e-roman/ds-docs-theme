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
}

type V = { tokens: Token[]; options?: FoundationOptions }

/** Cuadrito de color con borde, para que se vean también los blancos. */
const Swatch = ({ color }: { color: string }) => <span className="inline-block size-8 shrink-0 rounded-md border" style={{ background: color }} />

/** Tabla genérica: muestra, nombre del token (copiable), valor resuelto y a qué apunta. */
export function TokenTable({ tokens, prefix, sample }: { tokens: Token[]; prefix?: string; sample?: (t: Token) => React.ReactNode }) {
  // si los tokens traen descripción se muestra «Uso»; si no, a qué token apuntan («Referencia»)
  const hasDesc = tokens.some((t) => t.desc)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {sample && <TableHead className="w-24">Muestra</TableHead>}
          <TableHead>Token</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead className="hidden sm:table-cell">{hasDesc ? "Uso" : "Referencia"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((t) => (
          <TableRow key={t.name}>
            {sample && <TableCell>{sample(t)}</TableCell>}
            <TableCell><CopyToken name={t.name} label={prefix ? `--${prefix}${rest(t, prefix)}` : undefined} /></TableCell>
            <TableCell className="font-mono text-xs">{t.resolved}</TableCell>
            <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{hasDesc ? (t.desc ?? "") : t.value !== t.resolved ? t.value : "—"}</TableCell>
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
      <TokenTable tokens={withPrefix(tokens, "spacing-")} sample={(t) => <span className="block h-3 rounded-sm bg-primary" style={{ width: t.resolved }} />} />
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
        <TokenTable tokens={withPrefix(tokens, "duration-")} sample={(t) => <MotionBar duration={t.resolved} />} />
      </Section>
      <Section title="Curvas" intro="Cómo acelera y frena una transición. «standard» sirve para casi todo; «out» para lo que entra en pantalla.">
        <TokenTable tokens={withPrefix(tokens, "easing-")} sample={(t) => <MotionBar easing={t.resolved} />} />
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

const VIEWS: Record<string, (p: V) => React.JSX.Element> = {
  tokens: TokensView, color: ColorView, typography: TypographyView, spacing: SpacingView,
  radius: RadiusView, shadow: ShadowView, border: BorderView, opacity: OpacityView, motion: MotionView, size: SizeView,
}

export const FoundationView = ({ slug, tokens, options }: { slug: string; tokens: Token[]; options?: FoundationOptions }) => {
  const View = VIEWS[slug]
  return View ? <View tokens={tokens} options={options} /> : null
}
