"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { FRAME_CSS, openInspection, useActiveKey } from "./inspector"
import type { Anatomy } from "../types"

type Mark = { n: number; x: number; y: number; line: { left: number; top: number; width: number; height: number } }

const GAP = 36
const SIZE = 24

/**
 * Anatomía interactiva: la story real en un iframe del mismo origen, con un número por parte unido al elemento con una línea.
 * Los números (y la leyenda) abren el panel con las propiedades y los tokens de esa parte. Las posiciones se miden sobre
 * el componente real, así no se descolocan si cambia de tamaño.
 */
export function AnatomyView({ title, src, anatomy }: { title: string; src: string; anatomy: Anatomy }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(120)
  const [marks, setMarks] = useState<Mark[]>([])
  const [ready, setReady] = useState(false)
  const cleanup = useRef<(() => void) | null>(null)
  const active = useActiveKey()
  const uid = `${anatomy.story}`

  const attach = useCallback(() => {
    const el = frame.current
    const doc = el?.contentDocument
    const win = el?.contentWindow
    if (!el || !doc || !win || !doc.body) return
    cleanup.current?.()
    const style = doc.createElement("style")
    style.textContent = FRAME_CSS
    doc.head.appendChild(style)

    const root = doc.getElementById("storybook-root")
    if (!root) return
    const compute = () => {
      // alto del contenido (la story puede centrarse en un body tan alto como el marco) más el padding de Storybook
      setHeight(Math.max(40, Math.ceil(root.getBoundingClientRect().height) + 32))
      const ox = el.offsetLeft
      const oy = el.offsetTop
      const next: Mark[] = []
      for (const p of anatomy.parts) {
        const target = doc.getElementById("storybook-root")?.querySelector(p.selector)
        if (!target) continue
        const r = target.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        const f = (p.pct ?? 50) / 100
        const left = ox + r.left
        const top = oy + r.top
        let x: number, y: number, line: Mark["line"]
        if (p.side === "top" || p.side === "bottom") {
          x = left + r.width * f
          const edge = p.side === "top" ? top : top + r.height
          y = p.side === "top" ? edge - GAP : edge + GAP
          line = { left: x, top: Math.min(y, edge), width: 1, height: GAP }
        } else {
          y = top + r.height * f
          const edge = p.side === "left" ? left : left + r.width
          x = p.side === "left" ? edge - GAP : edge + GAP
          line = { left: Math.min(x, edge), top: y, width: GAP, height: 1 }
        }
        next.push({ n: p.n, x, y, line })
      }
      setMarks(next)
    }
    // el observador debe ser el de la ventana del iframe, para que mida su documento
    const ro = new (win as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver(compute)
    ro.observe(root)
    // React monta el contenido después de la carga y los modales se animan: se vuelve a medir mientras cambia
    const mo = new (win as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver(compute)
    mo.observe(root, { childList: true, subtree: true, attributes: true })
    doc.addEventListener("transitionend", compute, true)
    // si la página cambia de ancho (por ejemplo, al abrirse el panel) el marco se desplaza y hay que volver a medir
    const stage = new ResizeObserver(compute)
    if (el.parentElement) stage.observe(el.parentElement)
    window.addEventListener("resize", compute)
    // se muestra cuando Storybook terminó de dibujar la story (`sb-show-main`), con un tope por si nunca llega
    let tries = 0
    const poll = setInterval(() => {
      tries++
      const rendered = doc.body.classList.contains("sb-show-main") && root.childElementCount > 0
      if (rendered || tries > 40) {
        if (rendered) compute()
        setReady(true)
        clearInterval(poll)
      }
    }, 100)
    const timer = setInterval(compute, 250)
    const stop = setTimeout(() => clearInterval(timer), 3000)
    compute()
    cleanup.current = () => {
      ro.disconnect()
      mo.disconnect()
      stage.disconnect()
      window.removeEventListener("resize", compute)
      doc.removeEventListener("transitionend", compute, true)
      clearInterval(timer)
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [anatomy.parts])

  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === "complete") attach()
    return () => cleanup.current?.()
  }, [attach])

  const inspectPart = (n: number) => {
    const p = anatomy.parts.find((x) => x.n === n)
    const target = p && frame.current?.contentDocument?.getElementById("storybook-root")?.querySelector(p.selector)
    if (p && target) void openInspection(target, p.label, `${uid}:${n}`)
  }

  return (
    <>
      <div className="relative rounded-xl border bg-muted px-16 py-16">
        <iframe
          ref={frame}
          title={`Anatomía de ${title}`}
          src={src}
          loading="lazy"
          onLoad={attach}
          scrolling="no"
          style={{ height, maxWidth: anatomy.width ?? 480 }}
          className={`mx-auto block w-full overflow-hidden border-0 bg-muted transition-opacity duration-150 ${ready ? "opacity-100" : "opacity-0"}`}
        />
        {!ready && (
          <div aria-hidden className="absolute inset-0 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {ready && marks.map((m) => (
          <span key={m.n}>
            <span aria-hidden className="absolute bg-foreground/50" style={m.line} />
            <button
              type="button"
              aria-label={`Ver propiedades: ${anatomy.parts.find((p) => p.n === m.n)?.label}`}
              onClick={() => inspectPart(m.n)}
              className={`absolute flex cursor-pointer -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold text-background ${active === `${uid}:${m.n}` ? "bg-brand ring-4 ring-brand/30" : "bg-foreground"}`}
              style={{ left: m.x, top: m.y, width: SIZE, height: SIZE }}
            >
              {m.n}
            </button>
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Hacé clic en un número para ver las propiedades y los tokens de esa parte.</p>
      <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {anatomy.parts.map((p) => (
          <li key={p.n}>
            <button type="button" onClick={() => inspectPart(p.n)} className="group flex cursor-pointer items-center gap-3 text-left text-sm">
              <b className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-background ${active === `${uid}:${p.n}` ? "bg-brand" : "bg-foreground"}`}>{p.n}</b>
              <span className={`underline-offset-4 group-hover:underline ${active === `${uid}:${p.n}` ? "underline" : ""}`}>{p.label}{p.note && <span className="text-muted-foreground"> ({p.note})</span>}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
