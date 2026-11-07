"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"
import { SearchDialog } from "./search-dialog"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import type { SearchEntry } from "../lib/search"

/** Marca del sitio: el proyecto pone su logo y nombre; el resto del header es del theme. */
export type SiteBrand = { name: string; /** Texto bajo el logo, ej. «Design System». */ tagline?: string; logo: { src: string; width: number; height: number } }
export type TopNavItem = { href: string; label: string }

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`)

/** Menú superior: logo, secciones y buscador. En móvil, las secciones van en un panel lateral. */
export function SiteHeader({ entries, brand, topNav }: { entries: SearchEntry[]; brand: SiteBrand; topNav: TopNavItem[] }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label={`${brand.name}${brand.tagline ? ` ${brand.tagline}` : ""}, inicio`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo.src} alt={brand.name} width={brand.logo.width} height={brand.logo.height} className="h-7 w-auto" />
        {brand.tagline && <small className="hidden border-l pl-3 text-[11px] font-medium leading-5 text-muted-foreground sm:block">{brand.tagline}</small>}
      </Link>

      <nav aria-label="Principal" className="ml-auto hidden h-full items-stretch gap-1 md:flex">
        {topNav.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive(path, i.href) ? "page" : undefined}
            className="flex items-center border-b-2 border-transparent px-4 text-sm font-medium transition-colors hover:text-brand aria-[current=page]:border-brand aria-[current=page]:text-brand"
          >
            {i.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto md:ml-2">
        <SearchDialog entries={entries} />
      </div>

      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" onClick={() => setOpen(true)}>
        <MenuIcon />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <nav aria-label="Principal (móvil)" className="flex flex-col px-4">
            {topNav.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(path, i.href) ? "page" : undefined}
                className="border-b py-3 text-base font-medium aria-[current=page]:text-brand"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
