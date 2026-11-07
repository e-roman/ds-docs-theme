/** Primer elemento que coincide con el selector, buscando también dentro de los shadow roots abiertos (modo «aislado»). */
export function queryDeep(root: ParentNode, selector: string): Element | null {
  const hit = root.querySelector(selector)
  if (hit) return hit
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const sr = (el as HTMLElement).shadowRoot
    if (sr) {
      const found = queryDeep(sr, selector)
      if (found) return found
    }
  }
  return null
}
