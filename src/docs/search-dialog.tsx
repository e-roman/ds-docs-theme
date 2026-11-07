"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { search, type SearchEntry } from "../lib/search"

/** Buscador del sitio (⌘K / Ctrl+K): páginas y tokens. El índice llega ya armado desde el servidor. */
export function SearchDialog({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const hits = useMemo(() => search(entries, query, 30), [entries, query])
  const groups = useMemo(() => {
    const m = new Map<string, typeof hits>()
    for (const h of hits) m.set(h.entry.group, [...(m.get(h.entry.group) ?? []), h])
    return [...m]
  }, [hits])

  const go = (path: string) => {
    setOpen(false)
    setQuery("")
    router.push(path)
  }

  return (
    <>
      <Button variant="outline" className="justify-start gap-2 rounded-full text-muted-foreground sm:w-52" onClick={() => setOpen(true)} aria-label="Buscar">
        <SearchIcon />
        <span className="hidden flex-1 text-left sm:inline">Buscar…</span>
        <kbd className="hidden rounded border px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Buscá páginas y tokens del sistema de diseño.">
        {/* shouldFilter=false: el orden y el filtro los hace lib/search.ts (difuso, con sinónimos) */}
        <Command shouldFilter={false}>
        <CommandInput placeholder="Buscar páginas y tokens…" value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim() && hits.length === 0 && <CommandEmpty>Sin resultados.</CommandEmpty>}
          {!query.trim() && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribí el nombre de una página o de un token.</p>}
          {groups.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map(({ entry }) => (
                <CommandItem key={entry.id} value={entry.id} onSelect={() => go(entry.path)}>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{entry.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{entry.value ?? entry.crumb}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
