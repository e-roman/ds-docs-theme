"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { FRAME_CSS, openInspection, useActiveKey } from "./inspector"
import { queryDeep } from "../lib/dom"
import type { Anatomy } from "../types"

type Mark = { n: number; x: number; y: number; line: { left: number; top: number; width: number; height: number } }

const GAP = 36
const SIZE = 24

/** Posición del número de una parte y su línea, a partir del rectángulo del elemento (relativo a la caja). */
function markFor(p: Anatomy["parts"][number], left: number, top: number, width: number, height: number): Mark {
  const f = (p.pct ?? 50) / 100
  let x: number, y: number, line: Mark["line"]
  if (p.side === "top" || p.side === "bottom") {
    x = left + width * f
    const edge = p.side === "top" ? top : top + height
    y = p.side === "top" ? edge - GAP : edge + GAP
    line = { left: x, top: Math.min(y, edge), width: 1, height: GAP }
  } else {
    y = top + height * f
    const edge = p.side === "left" ? left : left + width
    x = p.side === "left" ? edge - GAP : edge + GAP
    line = { left: Math.min(x, edge), top: y, width: GAP, height: 1 }
  }
  return { n: p.n, x, y, line }
}

/** Números sobre el componente, unidos con una línea a su parte. */
function MarkLayer({ marks, anatomy, uid, active, onPick }: { marks: Mark[]; anatomy: Anatomy; uid: string; active: string | null; onPick: (n: number) => void }) {
  return marks.map((m) => (
    <span key={m.n}>
      <span aria-hidden className="absolute bg-foreground/50" style={m.line} />
      <button
        type="button"
        aria-label={`Ver propiedades: ${anatomy.parts.find((p) => p.n === m.n)?.label}`}
        onClick={() => onPick(m.n)}
        className={`absolute flex cursor-pointer -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold text-background ${active === `${uid}:${m.n}` ? "bg-brand ring-4 ring-brand/30" : "bg-foreground"}`}
        style={{ left: m.x, top: m.y, width: SIZE, height: SIZE }}
      >
        {m.n}
      </button>
    </span>
  ))
}

/** Leyenda: una línea por parte; abre el mismo panel que el número. */
function Legend({ anatomy, uid, active, onPick }: { anatomy: Anatomy; uid: string; active: string | null; onPick: (n: number) => void }) {
  return (
    <>
      <p className="mt-2 text-xs text-muted-foreground">Hacé clic en un número para ver las propiedades y los tokens de esa parte.</p>
      <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {anatomy.parts.map((p) => (
          <li key={p.n}>
            <button type="button" onClick={() => onPick(p.n)} className="group flex cursor-pointer items-center gap-3 text-left text-sm">
              <b className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-background ${active === `${uid}:${p.n}` ? "bg-brand" : "bg-foreground"}`}>{p.n}</b>
              <span className={`underline-offset-4 group-hover:underline ${active === `${uid}:${p.n}` ? "underline" : ""}`}>{p.label}{p.note && <span className="text-muted-foreground"> ({p.note})</span>}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}

/** Anatomía en modo «inline»: el componente real está en la misma página (sin iframe) y las partes se buscan dentro de él. */
function InlineAnatomy({ node, anatomy }: { node: ReactNode; anatomy: Anatomy }) {
  const box = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [marks, setMarks] = useState<Mark[]>([])
  const active = useActiveKey()
  const uid = anatomy.story

  const compute = useCallback(() => {
    const b = box.current
    const r0 = root.current
    if (!b || !r0) return
    const bb = b.getBoundingClientRect()
    const next: Mark[] = []
    for (const p of anatomy.parts) {
      const target = queryDeep(r0, p.selector)
      if (!target) continue
      const r = target.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      next.push(markFor(p, r.left - bb.left, r.top - bb.top, r.width, r.height))
    }
    setMarks(next)
  }, [anatomy.parts])

  useEffect(() => {
    compute()
    const ro = new ResizeObserver(compute)
    if (box.current) ro.observe(box.current)
    if (root.current) ro.observe(root.current)
    const mo = new MutationObserver(compute)
    if (root.current) mo.observe(root.current, { childList: true, subtree: true, attributes: true })
    window.addEventListener("resize", compute)
    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", compute)
    }
  }, [compute])

  const inspectPart = (n: number) => {
    const p = anatomy.parts.find((x) => x.n === n)
    const target = p && root.current && queryDeep(root.current, p.selector)
    if (p && target) void openInspection(target, p.label, `${uid}:${n}`, p.only)
  }

  return (
    <>
      <div ref={box} className="relative flex min-h-[260px] items-center justify-center rounded-xl border bg-muted px-16 py-16">
        <div ref={root} className="mx-auto flex w-fit justify-center" style={{ maxWidth: anatomy.width ?? 480 }}>{node}</div>
        <MarkLayer marks={marks} anatomy={anatomy} uid={uid} active={active} onPick={inspectPart} />
      </div>
      <Legend anatomy={anatomy} uid={uid} active={active} onPick={inspectPart} />
    </>
  )
}

/**
 * Anatomía interactiva: la story real en un iframe del mismo origen, con un número por parte unido al elemento con una línea.
 * Los números (y la leyenda) abren el panel con las propiedades y los tokens de esa parte. Las posiciones se miden sobre
 * el componente real, así no se descolocan si cambia de tamaño.
 */
function FrameAnatomy({ title, src, anatomy }: { title: string; src: string; anatomy: Anatomy }) {
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
    if (p && target) void openInspection(target, p.label, `${uid}:${n}`, p.only)
  }

  return (
    <>
      <div className="relative flex min-h-[260px] items-center justify-center rounded-xl border bg-muted px-16 py-16">
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
        {ready && <MarkLayer marks={marks} anatomy={anatomy} uid={uid} active={active} onPick={inspectPart} />}
      </div>
      <Legend anatomy={anatomy} uid={uid} active={active} onPick={inspectPart} />
    </>
  )
}

/** Anatomía interactiva. Con `node` (modo inline) el componente se dibuja en la página; con `src`, la story va en un iframe. */
export function AnatomyView({ title, src, node, anatomy }: { title: string; src?: string; node?: ReactNode; anatomy: Anatomy }) {
  if (node) return <InlineAnatomy node={node} anatomy={anatomy} />
  return <FrameAnatomy title={title} src={src ?? ""} anatomy={anatomy} />
}
