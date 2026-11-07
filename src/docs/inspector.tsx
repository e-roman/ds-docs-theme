"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { X } from "lucide-react"
import { Button } from "../ui/button"
import { Copyable } from "./copyable"
import { inspect, loadTokens, type GroupKey, type Inspection, type Row } from "../lib/inspect"

/* Una sola inspección abierta en toda la página: la usan las vistas en vivo y la anatomía. */
type State = { data: Inspection | null; key: string | null; el: Element | null }
let state: State = { data: null, key: null, el: null }
const listeners = new Set<() => void>()
const set = (s: State) => {
  state = s
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const empty: State = { data: null, key: null, el: null }

/** Estilos que se inyectan en las stories embebidas: fondo gris claro (el mismo del bloque, `color-neutral-100`) y resaltado de la parte elegida. */
export const FRAME_CSS = `
html, body { background: #f5f5f5 !important; }
[data-insp-hover], [data-insp-sel] { outline: 1px dashed #385DBE !important; outline-offset: 0 !important; }
[data-insp-hover] { cursor: pointer !important; }
`

/** Abre (o cambia) la inspección de un elemento. `key` identifica la fuente (por ejemplo el número de la anatomía) para resaltarla. */
export async function openInspection(el: Element, title?: string, key?: string) {
  const tokens = await loadTokens()
  state.el?.removeAttribute("data-insp-sel")
  el.removeAttribute("data-insp-hover")
  el.setAttribute("data-insp-sel", "")
  set({ data: inspect(el, tokens, title), key: key ?? null, el })
}

export function closeInspection() {
  state.el?.removeAttribute("data-insp-sel")
  set(empty)
}

/** Clave de la fuente que tiene la inspección abierta (para marcar su número). */
export const useActiveKey = () => useSyncExternalStore(subscribe, () => state.key, () => null)

const SECTIONS: { title: string; keys: GroupKey[] }[] = [
  { title: "Apariencia", keys: ["fondo", "texto", "borde", "radio"] },
  { title: "Espaciado", keys: ["padding", "gap"] },
  { title: "Tamaño", keys: ["alto", "ancho"] },
  { title: "Tipografía", keys: ["tipografia"] },
]

/** Token que se copia como `var(--nombre)`. */
function Chip({ name }: { name: string }) {
  return <Copyable text={`var(--${name})`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs hover:bg-accent">{name}</Copyable>
}

function RowView({ r }: { r: Row }) {
  return (
    <div className="space-y-1.5 border-t px-4 py-3 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-primary">{r.label}</span>
        <span className="text-sm font-normal">{r.value}</span>
      </div>
      {r.chains.length === 0 ? (
        <p className="text-xs text-muted-foreground">{r.inherited ? "heredado del contenedor" : "valor fijo, sin token"}</p>
      ) : (
        <div className="flex flex-col items-end gap-1">
          {r.chains.map((c, i) => (
            <span key={i} className="flex flex-wrap items-center justify-end gap-1">
              {c.map((n, j) => (
                <span key={n} className="flex items-center gap-1">
                  {j > 0 && <span className="text-muted-foreground" aria-hidden>→</span>}
                  <Chip name={n} />
                </span>
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Panel lateral con las propiedades y los tokens de la parte elegida. No es un modal: empuja la página
 * (como en la documentación de Orali) y se puede seguir haciendo clic en otras partes. Se monta una vez por página.
 */
export function InspectDrawer() {
  const { data } = useSyncExternalStore(subscribe, () => state, () => empty)
  const open = data !== null

  useEffect(() => {
    document.body.style.transition = "padding-right 150ms"
    document.body.style.paddingRight = open ? "26.5rem" : ""
    return () => { document.body.style.paddingRight = "" }
  }, [open])

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === "Escape" && closeInspection()
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [open])

  // Al salir de la página no debe quedar nada seleccionado.
  useEffect(() => closeInspection, [])

  if (!data) return null
  return (
    <aside aria-label="Propiedades del componente" className="fixed bottom-0 right-0 top-0 z-50 w-[26.5rem] overflow-y-auto border-l bg-background shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
        <div>
          <h2 className="font-heading text-base font-semibold">{data.title}</h2>
          <p className="text-xs text-muted-foreground">Propiedades y tokens de la parte seleccionada</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={closeInspection}><X /></Button>
      </div>
      <div className="space-y-4 p-4">
        {data.rows.length === 0 && <p className="text-sm text-muted-foreground">Sin propiedades para mostrar.</p>}
        {SECTIONS.map((s) => {
          const rows = data.rows.filter((r) => s.keys.includes(r.key))
          if (rows.length === 0) return null
          return (
            <section key={s.title} className="overflow-hidden rounded-lg border">
              <h3 className="bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">{s.title}</h3>
              {rows.map((r) => <RowView key={r.key} r={r} />)}
            </section>
          )
        })}
        <p className="text-xs text-muted-foreground">Seguí haciendo clic en otras partes para cambiar el contenido. Clic en un token para copiar su variable CSS.</p>
      </div>
    </aside>
  )
}
