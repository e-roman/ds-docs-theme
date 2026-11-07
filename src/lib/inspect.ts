/**
 * Motor del inspector: lee lo que el navegador calcula para un elemento y rastrea de qué token sale cada valor,
 * siguiendo las reglas CSS reales (var(--bs-btn-bg) → var(--color-brand-700) → …).
 * Corre en el navegador y trabaja sobre el documento del elemento, que puede ser el de un iframe del mismo origen.
 */

/** nombre de token (sin "--") → [valor crudo, valor resuelto] */
export type TokenMap = Record<string, [string, string]>

export type GroupKey = "fondo" | "texto" | "borde" | "radio" | "padding" | "gap" | "alto" | "ancho" | "tipografia"
export type Row = { key: GroupKey; label: string; value: string; chains: string[][]; inherited: boolean }
export type Inspection = { title: string; rows: Row[] }

let tokenPromise: Promise<TokenMap> | null = null
export function loadTokens(): Promise<TokenMap> {
  tokenPromise ??= fetch("/api/tokens").then((r) => r.json())
  return tokenPromise
}

const rgbHex = (v: string) => {
  const m = v.match(/rgba?\(([^)]+)\)/)
  if (!m) return v
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  return "#" + h(p[0]) + h(p[1]) + h(p[2]) + (p[3] !== undefined && p[3] < 1 ? h(p[3] * 255) : "")
}
const px = (v: string) => (parseFloat(v) % 1 === 0 ? `${parseFloat(v)}px` : `${parseFloat(v).toFixed(1)}px`)

/** Todas las reglas de estilo del documento, en orden, dentro de @media/@supports/@layer aplicables. */
function flatten(doc: Document): CSSStyleRule[] {
  const win = doc.defaultView!
  const out: CSSStyleRule[] = []
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      const sr = r as CSSStyleRule
      if (typeof sr.selectorText === "string" && sr.style) out.push(sr)
      else if ("media" in r) {
        try {
          if (win.matchMedia((r as CSSMediaRule).conditionText ?? (r as CSSMediaRule).media.mediaText).matches) walk((r as unknown as CSSGroupingRule).cssRules)
        } catch {}
      } else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(doc.styleSheets)) {
    try { walk(sheet.cssRules) } catch {} // hojas de otro origen (fuentes): se ignoran
  }
  return out
}

const STATE_PSEUDO = /:(hover|active|focus|focus-visible|focus-within)\b/

/** Quita `fn(...)` (con paréntesis balanceados) del selector. */
function stripFn(sel: string, fn: string): string {
  let out = sel
  for (;;) {
    const i = out.indexOf(fn + "(")
    if (i < 0) return out
    let depth = 0
    let j = i + fn.length
    for (; j < out.length; j++) {
      if (out[j] === "(") depth++
      else if (out[j] === ")" && --depth === 0) break
    }
    out = out.slice(0, i) + out.slice(j + 1)
  }
}

/** Especificidad aproximada (ids·10000 + clases/atributos/pseudoclases·100 + elementos). :where() vale 0. */
function specificity(sel: string): number {
  const s = stripFn(sel, ":where")
  const ids = (s.match(/#[\w-]+/g) ?? []).length
  const cls = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)(?!is\(|not\()[\w-]+/g) ?? []).length
  const els = (s.match(/(^|[\s>+~(,])[a-zA-Z][\w-]*/g) ?? []).length + (s.match(/::[\w-]+/g) ?? []).length
  return ids * 10000 + cls * 100 + els
}

/** Divide un selector agrupado por comas de primer nivel. */
function splitTop(sel: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of sel) {
    if (ch === "(" || ch === "[") depth++
    if (ch === ")" || ch === "]") depth--
    if (ch === "," && depth === 0) { parts.push(cur); cur = "" } else cur += ch
  }
  parts.push(cur)
  return parts
}

/** Reglas que aplican al elemento, de menor a mayor prioridad (especificidad y luego orden), sin las de estado (hover/foco). */
function matching(el: Element): CSSStyleDeclaration[] {
  const found: { style: CSSStyleDeclaration; spec: number; order: number }[] = []
  let order = 0
  for (const r of flatten(el.ownerDocument)) {
    order++
    let spec = -1
    for (const part of splitTop(r.selectorText)) {
      if (STATE_PSEUDO.test(part)) continue
      try { if (el.matches(part.trim())) spec = Math.max(spec, specificity(part)) } catch {}
    }
    if (spec >= 0) found.push({ style: r.style, spec, order })
  }
  found.sort((a, b) => a.spec - b.spec || a.order - b.order)
  const res = found.map((f) => f.style)
  if ((el as HTMLElement).style) res.push((el as HTMLElement).style)
  return res
}

/** Última declaración (por orden) de cualquiera de las propiedades. */
function declared(rules: CSSStyleDeclaration[], names: string[]): string | null {
  for (let i = rules.length - 1; i >= 0; i--) {
    for (const n of names) {
      const v = rules[i].getPropertyValue(n)
      if (v) return v
    }
  }
  return null
}

const varNames = (text: string) => [...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1].slice(2))

/** Sigue la referencia de un token hasta el valor final: [color-semantic-surface-brand, color-brand-700]. */
function follow(name: string, tokens: TokenMap): string[] {
  const chain = [name]
  let raw = tokens[name]?.[0] ?? ""
  for (let i = 0; i < 8; i++) {
    const m = raw.trim().match(/^var\(--([\w-]+)\)$/)
    if (!m || !tokens[m[1]]) break
    chain.push(m[1])
    raw = tokens[m[1]][0]
  }
  return chain
}

/** Resuelve una variable usada por una regla: si es un token, sigue su cadena; si es local (--bs-btn-bg), busca su declaración. */
function resolve(name: string, rules: CSSStyleDeclaration[], tokens: TokenMap, depth = 0): string[][] {
  if (tokens[name]) return [follow(name, tokens)]
  if (depth > 6) return []
  const text = declared(rules, ["--" + name])
  if (!text) return []
  return varNames(text).flatMap((n) => resolve(n, rules, tokens, depth + 1))
}

const GROUPS: { key: GroupKey; label: string; props: string[] }[] = [
  { key: "fondo", label: "Fondo", props: ["background-color", "background"] },
  { key: "texto", label: "Color", props: ["color"] },
  { key: "borde", label: "Borde", props: ["border", "border-color", "border-width", "border-style"] },
  { key: "radio", label: "Radio", props: ["border-radius"] },
  { key: "padding", label: "Padding", props: ["padding", "padding-inline", "padding-block", "padding-left", "padding-right", "padding-top", "padding-bottom"] },
  { key: "gap", label: "Gap", props: ["gap", "column-gap", "row-gap"] },
  { key: "alto", label: "Alto", props: ["min-height", "height"] },
  { key: "ancho", label: "Ancho", props: ["min-width", "width"] },
  { key: "tipografia", label: "Tipografía", props: ["font", "font-size", "line-height", "font-weight"] },
]

/** Colores de una copia fuera de foco/hover: el estado mostrado es el de reposo aunque el mouse esté encima. */
function restingColors(el: Element) {
  const win = el.ownerDocument.defaultView!
  const probe = el.cloneNode(true) as HTMLElement
  probe.removeAttribute("data-insp-hover")
  probe.removeAttribute("data-insp-sel")
  probe.style.cssText += ";position:absolute;left:-9999px;top:0;pointer-events:none;visibility:hidden"
  el.parentElement?.appendChild(probe)
  const cs = win.getComputedStyle(probe)
  const res = { bg: cs.backgroundColor, color: cs.color, borderColor: cs.borderTopColor }
  probe.remove()
  return res
}

export function inspect(el: Element, tokens: TokenMap, title?: string): Inspection {
  const cs = el.ownerDocument.defaultView!.getComputedStyle(el)
  const rest = restingColors(el)
  const rules = matching(el)
  const rows: Row[] = []

  const value = (key: GroupKey): string | null => {
    switch (key) {
      case "fondo": return rest.bg === "rgba(0, 0, 0, 0)" ? null : rgbHex(rest.bg)
      case "texto": return rgbHex(rest.color)
      case "borde": return parseFloat(cs.borderTopWidth) > 0 ? `${px(cs.borderTopWidth)} ${rgbHex(rest.borderColor)}` : null
      case "radio": return parseFloat(cs.borderTopLeftRadius) > 0 ? (parseFloat(cs.borderTopLeftRadius) >= 9999 ? "full" : px(cs.borderTopLeftRadius)) : null
      case "padding": {
        const v = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px)
        return v.every((x) => x === "0px") ? null : v[0] === v[2] && v[1] === v[3] ? (v[0] === v[1] ? v[0] : `${v[0]} ${v[1]}`) : v.join(" ")
      }
      case "gap": return cs.columnGap !== "normal" && /flex|grid/.test(cs.display) ? px(cs.columnGap) : null
      // medidas reales en pantalla: un elemento en línea (como un ícono) no tiene `height` calculado
      case "alto": { const h = el.getBoundingClientRect().height; return h > 0 ? px(String(h)) : null }
      case "ancho": { const w = el.getBoundingClientRect().width; return w > 0 ? px(String(w)) : null }
      case "tipografia": return `${px(cs.fontSize)} / ${px(cs.lineHeight)} · ${cs.fontWeight}`
    }
  }

  for (const g of GROUPS) {
    if (g.key === "ancho") continue
    const v = value(g.key)
    if (v === null) continue
    // Cada propiedad por separado (font-size, line-height, font-weight…): se unen los tokens de todas.
    const texts = g.props.map((n) => declared(rules, [n])).filter((t): t is string => !!t)
    const seen = new Set<string>()
    const chains = texts.flatMap((t) => varNames(t).flatMap((n) => resolve(n, rules, tokens))).filter((c) => {
      const k = c.join(">")
      return seen.has(k) ? false : (seen.add(k), true)
    })
    rows.push({ key: g.key, label: g.label, value: v, chains, inherited: texts.length === 0 })
  }

  const cls = (el.getAttribute("class") ?? "").split(/\s+/).filter((c) => c && !c.startsWith("data-insp"))[0]
  return { title: title ?? el.tagName.toLowerCase() + (cls ? "." + cls : ""), rows }
}
