"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

const ALL = [
  { id: "design", label: "Diseño" },
  { id: "usage", label: "Uso" },
  { id: "accessibility", label: "Accesibilidad" },
  { id: "updates", label: "Historial" },
] as const

export type DocTabId = (typeof ALL)[number]["id"]

/** Pestañas de una página de componente o patrón. Solo se muestran las que tienen contenido; la elegida queda en el # de la URL. */
export function DocTabs({ panels }: { panels: Partial<Record<DocTabId, ReactNode>> }) {
  const tabs = ALL.filter((t) => panels[t.id] != null)
  const [value, setValue] = useState<string>("design")

  useEffect(() => {
    const h = location.hash.slice(1)
    // fuera del cuerpo síncrono del efecto: el # es un dato externo que se lee una sola vez
    if (tabs.some((t) => t.id === h)) queueMicrotask(() => setValue(h))
    // solo al montar: lee el # inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        setValue(String(v))
        history.replaceState(null, "", `#${v}`)
      }}
    >
      <TabsList variant="line" className="mb-2 w-full! justify-start! border-b" aria-label="Secciones">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="flex-none! px-3">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="pt-6">
          {panels[t.id]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
