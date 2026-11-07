import fs from "node:fs"
import type { Token } from "../types"

export type { Token }

const cache = new Map<string, Token[]>()

/**
 * Lee el CSS de tokens del proyecto (ruta absoluta o relativa al proceso, ej. `node_modules/@ketea/tokens/dist/tokens.css`).
 * Fuente única: los tokens nunca se copian a la documentación. Solo corre en el servidor.
 */
export function readTokens(cssFile: string): Token[] {
  const hit = cache.get(cssFile)
  if (hit) return hit
  const raw = new Map<string, string>()
  for (const line of fs.readFileSync(cssFile, "utf8").split("\n")) {
    const m = line.match(/^\s*--([\w-]+):\s*(.+?);\s*$/)
    if (!m || m[1].endsWith("-rgb")) continue
    raw.set(m[1], m[2])
  }
  const resolve = (v: string, depth = 0): string =>
    depth > 10 ? v : v.replace(/var\(--([\w-]+)\)/g, (_, n) => (raw.has(n) ? resolve(raw.get(n)!, depth + 1) : `var(--${n})`))
  const all = [...raw].map(([name, value]) => ({ name, value, resolved: resolve(value) }))
  cache.set(cssFile, all)
  return all
}

/** Un token por nombre (sin "--"). */
export const findToken = (tokens: Token[], name: string) => tokens.find((t) => t.name === name)

export const withPrefix = (tokens: Token[], prefix: string) => tokens.filter((t) => t.name.startsWith(prefix))
export const rest = (t: Token, prefix: string) => t.name.slice(prefix.length)

/** Grupos semánticos de color (color-semantic-<grupo>-…). */
export const SEMANTIC_GROUPS = ["surface", "text", "border", "icon", "feedback", "forms"]

/** Escalas de color: primitivos agrupados por rampa (neutral, slate, rose…) y semánticos por grupo. */
export function colorGroups(tokens: Token[]) {
  const ramps = new Map<string, Token[]>()
  const brand: Token[] = []
  const semantic = new Map<string, Token[]>()
  for (const t of withPrefix(tokens, "color-")) {
    const parts = t.name.split("-")
    if (parts[1] === "semantic") {
      const g = parts[2]
      if (!semantic.has(g)) semantic.set(g, [])
      semantic.get(g)!.push(t)
    } else if (parts[1] === "brand") {
      brand.push(t)
    } else {
      const ramp = parts[1] === "blue" && parts[2] === "brand" ? "blue-brand" : parts[1]
      if (!ramps.has(ramp)) ramps.set(ramp, [])
      ramps.get(ramp)!.push(t)
    }
  }
  return { ramps, brand, semantic }
}

/** Cantidad de tokens por familia (primer segmento del nombre). */
export function countsByFamily(tokens: Token[]) {
  const counts = new Map<string, number>()
  for (const t of tokens) {
    const f = t.name.split("-")[0]
    counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1])
}

export const isColor = (v: string) => /^(#|rgb|hsl)/i.test(v.trim())

/** Mapa compacto para el inspector: nombre → [valor crudo (con var()), valor resuelto]. Lo sirve la ruta `/api/tokens` del proyecto. */
export function tokenMap(tokens: Token[]): Record<string, [string, string]> {
  const map: Record<string, [string, string]> = {}
  for (const t of tokens) map[t.name] = [t.value, t.resolved]
  return map
}
