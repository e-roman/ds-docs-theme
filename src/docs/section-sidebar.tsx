"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, MenuIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { ScrollArea } from "../ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import type { NavItem } from "../types"
import { cn } from "../lib/utils"

type Props = { title: string; base: string; items: NavItem[] }

/** Lista de páginas de una sección. Si los ítems tienen categoría, se agrupan en secciones plegables. */
function NavList({ title, base, items, onNavigate }: Props & { onNavigate?: () => void }) {
  const path = usePathname()
  const groups: { cat?: string; items: NavItem[] }[] = []
  for (const i of items) {
    const last = groups[groups.length - 1]
    if (last && last.cat === i.cat) last.items.push(i)
    else groups.push({ cat: i.cat, items: [i] })
  }

  const link = (i: NavItem) => {
    const href = `${base}/${i.slug}`
    const active = path === href
    return (
      <li key={i.slug}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn("block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted", active && "bg-muted font-medium text-brand")}
        >
          {i.title}
        </Link>
      </li>
    )
  }

  return (
    <nav aria-label={title} className="space-y-1">
      <h2 className="px-3 pb-2 text-base font-semibold">{title}</h2>
      {groups.map((g, gi) =>
        g.cat ? (
          <Collapsible key={g.cat} defaultOpen={g.items.some((i) => path === `${base}/${i.slug}`)}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
              {g.cat}
              <ChevronRightIcon className="size-4 transition-transform group-data-[panel-open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-0.5 pb-1 pl-2">{g.items.map(link)}</ul>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <ul key={gi} className="space-y-0.5">{g.items.map(link)}</ul>
        ),
      )}
    </nav>
  )
}

/** Menú lateral de una sección: columna fija en escritorio y panel desde la izquierda en móvil. */
export function SectionSidebar(props: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 border-r lg:block">
        <ScrollArea className="h-full">
          <div className="p-4">
            <NavList {...props} />
          </div>
        </ScrollArea>
      </aside>

      <div className="sticky top-16 z-20 border-b bg-background px-4 py-2 lg:hidden">
        <Button variant="outline" className="gap-2" onClick={() => setOpen(true)} aria-label={`Explorar ${props.title}`}>
          <MenuIcon />
          <span>
            Explorar <b>{props.title}</b>
          </span>
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="sr-only">{props.title}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 pb-6">
              <NavList {...props} onNavigate={() => setOpen(false)} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
