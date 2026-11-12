"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

/** Resaltado de la parte elegida por el inspector, dentro del shadow root (el CSS del documento no entra). */
const INSPECT_CSS = `
[data-insp-hover], [data-insp-sel] { outline: 1px dashed var(--brand, #385dbe) !important; outline-offset: 0 !important; }
[data-insp-hover] { cursor: pointer !important; }
/* el contenido va centrado en su caja (los hijos con ancho 100% siguen ocupando todo el ancho) */
[data-isolated-root] { display: flex; justify-content: center; align-items: center; }
`

/**
 * Espera a que lleguen las fuentes y las imágenes de lo que se acaba de montar (con un tope), para que la vista no cambie
 * de tamaño después de mostrarse: sin esto aparece con la letra del navegador o sin la foto y luego «se agranda».
 */
async function settle(root: ShadowRoot, cap = 2500) {
  const work = (async () => {
    // React termina de montar: se espera a que haya contenido (con la máquina cargada tarda más que un instante)
    for (let i = 0; i < 100 && !root.querySelector("[data-isolated-root]")?.firstElementChild; i++) await new Promise((r) => setTimeout(r, 30))
    await new Promise((r) => setTimeout(r, 30))
    await new Promise((r) => requestAnimationFrame(() => r(null))) // el diseño pide las fuentes que usa
    await document.fonts.ready
    const pending = Array.from(root.querySelectorAll("img")).filter((i) => !i.complete)
    await Promise.all(pending.map((i) => new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }) })))
    await document.fonts.ready
  })()
  await Promise.race([work, new Promise((r) => setTimeout(r, cap))])
}

/**
 * Dibuja `children` dentro de un shadow root con su propio CSS: los estilos del proyecto (por ejemplo, los de su tienda) no pisan a los del theme
 * ni al revés. Es el modo «aislado» del modo inline: tan rápido como renderizar directo, sin el peso de un iframe.
 * `css` son las URL de las hojas de estilo del proyecto (compiladas aparte). Las variables CSS del documento (tokens) y las fuentes cargadas
 * en la página sí llegan adentro. Los hijos son componentes de React normales: mantienen sus eventos y su estado.
 */
export function Isolated({ css, children, className, external }: {
  css: string[]
  children?: ReactNode
  className?: string
  /**
   * Monta una app externa (con su propio React, por ejemplo un paquete de vistas compilado aparte) dentro del shadow root.
   * Recibe el contenedor y devuelve cómo desmontarla; puede ser asíncrona. La vista aparece cuando termina de montar.
   * La caja contiene a sus hijos (`contain: layout paint`): un diálogo o drawer `position: fixed` queda dentro de ella y no cubre la página.
   */
  external?: (container: HTMLElement) => Promise<() => void> | (() => void)
}) {
  const host = useRef<HTMLDivElement>(null)
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [ready, setReady] = useState(false)
  const key = css.join("|")

  useEffect(() => {
    const el = host.current
    if (!el) return
    const root = el.shadowRoot ?? el.attachShadow({ mode: "open" })
    root.replaceChildren()
    let pending = css.length + (external ? 1 : 0)
    let off: (() => void) | undefined
    let cancelled = false
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
    if (external) {
      Promise.resolve()
        .then(() => external(div))
        .then(async (stop) => { if (cancelled) { stop(); return } off = stop; await settle(root) })
        .catch((e) => console.error("Isolated: no se pudo montar la vista externa", e))
        .finally(done)
    }
    const timer = setTimeout(() => setReady(true), 3000)
    return () => {
      clearTimeout(timer)
      cancelled = true
      off?.()
      root.replaceChildren()
      setMount(null)
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div ref={host} data-isolated={ready ? "ready" : "pending"} className={`w-full transition-opacity duration-150 ${external ? "[contain:layout_paint]" : ""} ${ready ? "opacity-100" : "opacity-0"} ${className ?? ""}`}>
      {mount && children !== undefined && createPortal(children, mount)}
    </div>
  )
}
