"use client"

import { useRef, useState, type ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

/** Copia al portapapeles; si el navegador bloquea la API moderna (permisos, HTTP en red local), usa el método clásico. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"
    document.body.appendChild(ta)
    ta.select()
    try {
      return document.execCommand("copy")
    } catch {
      return false
    } finally {
      ta.remove()
    }
  }
}

/**
 * Botón que copia un texto al portapapeles. Siempre con cursor de mano y la tooltip «Copiar»; al copiar dice «Copiado!» un instante.
 * Todo lo que se pueda copiar en la documentación usa este componente. Requiere un TooltipProvider en el layout.
 */
export function Copyable({ text, className = "", children, label }: { text: string; className?: string; children: ReactNode; /** Nombre accesible si el contenido no lo da. */ label?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const hovered = useRef(false)
  const keep = useRef(false)

  const copy = async () => {
    if (!(await copyText(text))) return
    setCopied(true)
    setOpen(true)
    keep.current = true
    setTimeout(() => {
      keep.current = false
      setCopied(false)
      if (!hovered.current) setOpen(false)
    }, 1200)
  }

  return (
    <Tooltip open={open} onOpenChange={(o) => { if (!o && keep.current) return; setOpen(o) }}>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={copy}
            aria-label={label}
            onMouseEnter={() => { hovered.current = true }}
            onMouseLeave={() => { hovered.current = false }}
            className={`cursor-pointer ${className}`}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? "Copiado!" : "Copiar"}</TooltipContent>
    </Tooltip>
  )
}
