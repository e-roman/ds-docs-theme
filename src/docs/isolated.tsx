"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

/** Resaltado de la parte elegida por el inspector, dentro del shadow root (el CSS del documento no entra). */
const INSPECT_CSS = `
[data-insp-hover], [data-insp-sel] { outline: 1px dashed var(--brand, #385dbe) !important; outline-offset: 0 !important; }
[data-insp-hover] { cursor: pointer !important; }
`

/**
 * Dibuja `children` dentro de un shadow root con su propio CSS: los estilos del proyecto (por ejemplo, los de su tienda) no pisan a los del theme
 * ni al revés. Es el modo «aislado» del modo inline: tan rápido como renderizar directo, sin el peso de un iframe.
 * `css` son las URL de las hojas de estilo del proyecto (compiladas aparte). Las variables CSS del documento (tokens) y las fuentes cargadas
 * en la página sí llegan adentro. Los hijos son componentes de React normales: mantienen sus eventos y su estado.
 */
export function Isolated({ css, children, className }: { css: string[]; children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [ready, setReady] = useState(false)
  const key = css.join("|")

  useEffect(() => {
    const el = host.current
    if (!el) return
    const root = el.shadowRoot ?? el.attachShadow({ mode: "open" })
    root.replaceChildren()
    let pending = css.length
    // se muestra cuando cargaron las hojas de estilo (con un tope por si alguna falla), para que no se vea sin estilo
    const done = () => { if (--pending <= 0) setReady(true) }
    if (pending === 0) setReady(true)
    for (const href of css) {
      const l = document.createElement("link")
      l.rel = "stylesheet"
      l.href = href
      l.addEventListener("load", done)
      l.addEventListener("error", done)
      root.appendChild(l)
    }
    const style = document.createElement("style")
    style.textContent = INSPECT_CSS
    root.appendChild(style)
    const div = document.createElement("div")
    div.setAttribute("data-isolated-root", "")
    root.appendChild(div)
    setMount(div)
    const timer = setTimeout(() => setReady(true), 3000)
    return () => {
      clearTimeout(timer)
      root.replaceChildren()
      setMount(null)
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div ref={host} className={`transition-opacity duration-150 ${ready ? "opacity-100" : "opacity-0"} ${className ?? ""}`}>
      {mount && createPortal(children, mount)}
    </div>
  )
}
