"use client"

import { Copyable } from "./copyable"

/** Nombre de token que se copia al hacer clic (como `var(--nombre)`). */
export function CopyToken({ name, label }: { name: string; label?: string }) {
  return (
    <Copyable text={`var(--${name})`} className="rounded bg-muted px-1.5 py-0.5 text-left font-mono text-xs hover:bg-accent">
      {label ?? `--${name}`}
    </Copyable>
  )
}
