import Link from "next/link"
import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react"
import { StoryPreview } from "./live-variants"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import type { ExternalLinks, NavItem, Prop } from "../types"

/** Ancho y márgenes de las páginas sin menú lateral (Empezar y los índices de sección). */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">{children}</main>
}

/** Links externos bajo el título: GitHub, Storybook y Figma (solo los que el proyecto define). Los iconos salen de /github.svg, /storybook.svg y /figma.svg en la carpeta public del proyecto. */
export function DocLinks({ github, storybook, figma }: ExternalLinks) {
  const links = [
    { label: "GitHub", href: github, icon: "/github.svg" },
    { label: "Storybook", href: storybook, icon: "/storybook.svg" },
    { label: "Figma", href: figma, icon: "/figma.svg" },
  ].filter((l): l is { label: string; href: string; icon: string } => Boolean(l.href))
  if (links.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm" aria-label="Enlaces externos">
      {links.map((l) => (
        <li key={l.label}>
          <a className="inline-flex items-center gap-2 font-medium hover:text-brand" href={l.href} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.icon} alt="" width={16} height={16} className="size-4" />
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function PageHeader({ title, description, links }: { title: string; description?: string; links?: ExternalLinks }) {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {description && <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>}
      {links && <DocLinks {...links} />}
    </div>
  )
}

export function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="mb-14 space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {intro && <p className="max-w-2xl text-sm text-muted-foreground">{intro}</p>}
      {children}
    </section>
  )
}

/** Carátula de una sección: título, bajada y una card con ilustración por cada página. */
export function SectionIndex({ title, intro, base, group, items }: { title: string; intro: string; base: string; group: string; items: NavItem[] }) {
  return (
    <PageContainer>
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{intro}</p>
      <ul className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i, n) => (
          <li key={i.slug} className="contents">
            {i.cat && i.cat !== items[n - 1]?.cat && <h2 className="col-span-full text-xl font-semibold">{i.cat}</h2>}
            <Link href={`${base}/${i.slug}`} className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <div aria-hidden className="grid aspect-[7/5] place-items-center rounded-2xl bg-muted transition-colors group-hover:bg-muted/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/illustrations/${group}/${i.slug}.svg`} alt="" width={120} height={120} className="size-28" />
              </div>
              <span className="mt-3 flex items-center justify-between text-sm font-semibold">
                {i.title}
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{i.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}

/** Círculo con check verde (sí) o X roja (no). Es el mismo icono en toda la documentación. */
export function StatusIcon({ ok, className = "size-5" }: { ok: boolean; className?: string }) {
  const Icon = ok ? CheckIcon : XIcon
  return (
    <span role="img" aria-label={ok ? "Correcto" : "Incorrecto"} className={`inline-grid shrink-0 place-items-center rounded-full text-white ${ok ? "bg-success" : "bg-danger"} ${className}`}>
      <Icon strokeWidth={3} className="size-[60%]" aria-hidden />
    </span>
  )
}

/** Cuándo usarlo (check verde) y cuándo evitarlo (X roja), en dos columnas. */
export function WhenToUse({ use, avoid }: { use: string[]; avoid: string[] }) {
  const col = (ok: boolean, title: string, items: string[]) => (
    <div className="rounded-2xl bg-muted p-6">
      <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold">
        <StatusIcon ok={ok} />
        {title}
      </h3>
      <ul className="list-disc space-y-3 pl-5 text-sm">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {col(true, "Cuándo usarlo", use)}
      {col(false, "Cuándo evitarlo", avoid)}
    </div>
  )
}

/** Tarjetas «sí / no» con un preview (una story de Storybook) y el motivo. */
export function DoDont({ items }: { items: { ok: boolean; title: string; text?: string; storyId: string; src: string; node?: React.ReactNode }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((it) => (
        <figure key={it.title}>
          <div className="relative overflow-hidden rounded-2xl border bg-white p-4">
            <StatusIcon ok={it.ok} className="absolute right-4 top-4 z-10 size-5" />
            {it.node ? <div className="bg-muted p-4">{it.node}</div> : <StoryPreview id={it.storyId} src={it.src} label={it.title} />}
          </div>
          <figcaption className="mt-3 text-sm">
            <b>{it.title}</b>
            {it.text && <span className="block text-muted-foreground">{it.text}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function PropsTable({ props }: { props: Prop[] }) {
  if (props.length === 0) return <p className="text-sm text-muted-foreground">Este componente no recibe props.</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prop</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descripción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.map(([name, type, desc, required]) => (
          <TableRow key={name}>
            <TableCell className="font-mono text-xs">
              {name}
              {required && <Badge variant="secondary" className="ml-2">requerida</Badge>}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{type}</TableCell>
            <TableCell className="whitespace-normal text-sm">{desc}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
