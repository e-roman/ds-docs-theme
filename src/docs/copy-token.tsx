"use client"

import { toast } from "sonner"

/** Nombre de token que se copia al hacer clic. */
export function CopyToken({ name, label }: { name: string; label?: string }) {
  const text = `var(--${name})`
  return (
    <button
      type="button"
      className="rounded bg-muted px-1.5 py-0.5 text-left font-mono text-xs hover:bg-muted/70"
      title={`Copiar ${text}`}
      onClick={() => {
        navigator.clipboard?.writeText(text)
        toast.success(`Copiado ${text}`)
      }}
    >
      {label ?? `--${name}`}
    </button>
  )
}
