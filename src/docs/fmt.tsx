import type { ReactNode } from "react"

/** Texto con `código` entre backticks. */
export const fmt = (s: string): ReactNode[] => s.split("`").map((p, i) => (i % 2 ? <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{p}</code> : p))
