"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ExternalLink, Loader2, MousePointerClick } from "lucide-react"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { fmt } from "./fmt"
import { FRAME_CSS, closeInspection, openInspection } from "./inspector"

export type LiveItem = { label: string; id: string; /** Story embebida (mismo origen, vía /sb). */ src: string; /** Enlace a la story en Storybook. */ href: string; width?: number; /** Texto bajo la vista. */ caption?: string; /** Fondo oscuro. */ dark?: boolean; /** Modo «inline»: el componente real se dibuja directo en la caja, sin iframe (el proyecto lo entrega ya armado). */ node?: ReactNode }

type Channel = { emit: (event: string, ...args: unknown[]) => void; on: (event: string, fn: (...args: unknown[]) => void) => void; off: (event: string, fn: (...args: unknown[]) => void) => void }
/** Canal interno de Storybook dentro del iframe: permite cambiar de story sin recargar la página. */
const channelOf = (win: Window) => (win as unknown as { __STORYBOOK_ADDONS_CHANNEL__?: Channel }).__STORYBOOK_ADDONS_CHANNEL__

/**
 * Story de Storybook en un iframe del mismo origen: se ajusta a su alto y, con el inspector activo, avisa qué parte se tocó.
 * Un solo iframe por bloque: al cambiar de vista le pide a Storybook la otra story por su canal (sin recargar) y, si el canal
 * no existe, recarga. Mientras tanto conserva el alto anterior y queda invisible hasta que la nueva story se dibujó.
 */
function LiveFrame({ item, inspecting }: { item: LiveItem; inspecting: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  // la dirección del primer render: el iframe no se recarga al cambiar de vista
  const [firstSrc] = useState(item.src)
  const current = useRef(item.id)
  const [height, setHeight] = useState(160)
  const [shown, setShown] = useState<string | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [boxW, setBoxW] = useState(0)
  const inspectingRef = useRef(inspecting)
  const measureRef = useRef<() => void>(() => {})
  const cleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    inspectingRef.current = inspecting
    if (!inspecting) ref.current?.contentDocument?.querySelectorAll("[data-insp-hover]").forEach((n) => n.removeAttribute("data-insp-hover"))
  }, [inspecting])

  const attach = useCallback(() => {
    const frame = ref.current
    const doc = frame?.contentDocument
    const win = frame?.contentWindow
    if (!doc || !win || !doc.body) return
    cleanup.current?.()

    const style = doc.createElement("style")
    style.textContent = FRAME_CSS
    doc.head.appendChild(style)

    const root = doc.getElementById("storybook-root")
    if (!root) return
    // alto del contenido (la story puede centrarse en un body tan alto como el marco) más el padding de Storybook
    const measure = () => {
      // mientras Storybook cambia de story el contenido queda vacío un instante: se conserva el alto anterior
      if (root.childElementCount === 0) return
      setHeight(Math.max(40, Math.ceil(root.getBoundingClientRect().height) + 32))
    }
    measureRef.current = measure
    // los observadores deben ser los de la ventana del iframe, para que midan su documento
    const ro = new (win as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver(measure)
    ro.observe(root)
    const mo = new (win as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver(measure)
    mo.observe(root, { childList: true, subtree: true })
    measure()

    // Se muestra cuando Storybook terminó de dibujar la story (`sb-show-main`), con un tope por si nunca llega.
    const id = current.current
    let tries = 0
    const poll = setInterval(() => {
      tries++
      if (doc.body.classList.contains("sb-show-main") && root.childElementCount > 0) {
        measure()
        setShown(id)
        clearInterval(poll)
      } else if (tries > 40) {
        setShown(id)
        clearInterval(poll)
      }
    }, 100)

    // lo que arma la story (contenedores de acomodo) no es parte del componente: no se resalta ni se inspecciona
    const isRoot = (t: Element) =>
      t === doc.documentElement || t === doc.body || t.id === "storybook-root" || t.hasAttribute("data-sb-wrapper") ||
      (t.hasAttribute("style") && !t.hasAttribute("class") && t.childElementCount > 0)
    const over = (e: Event) => {
      if (!inspectingRef.current) return
      doc.querySelectorAll("[data-insp-hover]").forEach((n) => n.removeAttribute("data-insp-hover"))
      const t = e.target as Element
      if (!isRoot(t)) t.setAttribute("data-insp-hover", "")
    }
    const click = async (e: Event) => {
      if (!inspectingRef.current) return
      const t = e.target as Element
      e.preventDefault()
      e.stopPropagation()
      if (isRoot(t)) return
      await openInspection(t)
    }
    doc.addEventListener("mouseover", over, true)
    doc.addEventListener("click", click, true)
    cleanup.current = () => {
      clearInterval(poll)
      ro.disconnect()
      mo.disconnect()
      doc.removeEventListener("mouseover", over, true)
      doc.removeEventListener("click", click, true)
    }
  }, [])

  useEffect(() => {
    const frame = ref.current
    // Si el iframe ya cargó antes de que React enganche el evento, se engancha ahora.
    if (frame?.contentDocument?.readyState === "complete") attach()
    return () => cleanup.current?.()
  }, [attach])

  // Ancho disponible del bloque, para escalar las stories de escritorio.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Cambio de vista: misma página de Storybook, otra story.
  useEffect(() => {
    if (item.id === current.current) return
    const frame = ref.current
    const channel = frame?.contentWindow ? channelOf(frame.contentWindow) : undefined
    current.current = item.id
    if (!frame || !channel) {
      // sin canal: recarga completa (el `onLoad` vuelve a enganchar todo)
      frame?.setAttribute("src", item.src)
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      channel.off("storyRendered", onRendered)
      clearTimeout(timer)
      measureRef.current()
      setShown(item.id)
    }
    const onRendered = (id: unknown) => { if (id === item.id) finish() }
    channel.on("storyRendered", onRendered)
    const timer = setTimeout(finish, 3000)
    channel.emit("setCurrentStory", { storyId: item.id, viewMode: "story" })
    return () => {
      done = true
      channel.off("storyRendered", onRendered)
      clearTimeout(timer)
    }
  }, [item.id, item.src])

  // Las stories de escritorio se dibujan a un ancho de diseño (Bootstrap decide la versión por el ancho del iframe) y se
  // escalan al ancho disponible; las de celular usan su propio ancho. Nunca se agrandan.
  const design = item.width ?? 1024
  const scale = boxW > 0 ? Math.min(1, boxW / design) : 1
  const offset = Math.max(0, (boxW - design * scale) / 2)

  return (
    <div ref={wrap} className="relative w-full" style={{ height: height * scale }}>
      <iframe
        ref={ref}
        title={item.label}
        src={firstSrc}
        loading="lazy"
        onLoad={attach}
        scrolling="no"
        style={{ width: design, height, left: offset, transform: `scale(${scale})`, transformOrigin: "top left" }}
        className={`absolute top-0 border-0 bg-muted transition-opacity duration-150 ${shown === item.id ? "opacity-100" : "opacity-0"}`}
      />
      {shown !== item.id && (
        <div aria-hidden className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

/** Vista en modo inline: el componente real en la misma página. Con «Inspeccionar» resalta la parte bajo el mouse y, al hacer clic, abre el panel (sin activar el componente). */
function InlineStage({ node, inspecting }: { node: ReactNode; inspecting: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || !inspecting) return
    // con el modo aislado el elemento real está dentro de un shadow root: el evento llega «retargeteado», el verdadero origen está en composedPath()
    const real = (e: Event) => (e.composedPath()[0] ?? e.target) as Element
    let last: Element | null = null
    const clear = () => { last?.removeAttribute("data-insp-hover"); last = null }
    const over = (e: Event) => {
      clear()
      const t = real(e)
      if (t !== root && t.nodeType === 1 && !t.hasAttribute("data-isolated-root") && !(t as HTMLElement).shadowRoot) {
        t.setAttribute("data-insp-hover", "")
        last = t
      }
    }
    const click = async (e: Event) => {
      const t = real(e)
      e.preventDefault()
      e.stopPropagation()
      if (t !== root && t.nodeType === 1 && !t.hasAttribute("data-isolated-root") && !(t as HTMLElement).shadowRoot) await openInspection(t)
    }
    root.addEventListener("mouseover", over, true)
    root.addEventListener("mouseleave", clear)
    root.addEventListener("click", click, true)
    return () => {
      root.removeEventListener("mouseover", over, true)
      root.removeEventListener("mouseleave", clear)
      root.removeEventListener("click", click, true)
      clear()
    }
  }, [inspecting])

  return <div ref={ref} className="w-full overflow-x-auto">{node}</div>
}

/** Story en vivo sin inspector: para ejemplos «sí / no» y vistas sueltas. */
export function StoryPreview({ id, src, label, width }: { id: string; src: string; label: string; width?: number }) {
  return (
    <div className="bg-muted p-4">
      <LiveFrame item={{ id, src, label, href: "", width }} inspecting={false} />
    </div>
  )
}

/** Vistas de una pieza en vivo (iframe de Storybook) con el botón «Inspeccionar», como en la documentación de Orali. */
export function LiveVariants({ title, items }: { title: string; items: LiveItem[] }) {
  const [value, setValue] = useState(items[0].id)
  const [inspecting, setInspecting] = useState(false)
  const cur = items.find((i) => i.id === value) ?? items[0]

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card transition-opacity duration-150 has-[[data-isolated=pending]]:opacity-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          {items.length > 1 ? (
            <Tabs value={value} onValueChange={(v) => { setValue(String(v)); closeInspection() }}>
              <TabsList aria-label={`Vistas de ${title}`}>
                {items.map((i) => <TabsTrigger key={i.id} value={i.id}>{i.label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          ) : (
            <span className="text-sm font-medium">{cur.label}</span>
          )}
          <div className="flex items-center gap-2">
            <Button variant={inspecting ? "default" : "outline"} size="sm" aria-pressed={inspecting} onClick={() => { setInspecting(!inspecting); closeInspection() }}>
              <MousePointerClick /> Inspeccionar
            </Button>
          </div>
        </div>
        <div className={`flex min-h-[260px] items-center p-6 ${cur.dark ? "bg-neutral-800" : "bg-muted"}`}>
          {cur.node ? <InlineStage node={cur.node} inspecting={inspecting} /> : <LiveFrame item={cur} inspecting={inspecting} />}
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {inspecting ? "Hacé clic en una parte del componente para ver sus propiedades y tokens." : cur.caption ? fmt(cur.caption) : cur.node ? "" : "Componente real de la tienda, publicado en Storybook."}
        </p>
        {!cur.node && (
          <a href={cur.href} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            Abrir en Storybook <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
    </>
  )
}
