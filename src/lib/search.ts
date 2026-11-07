/** Búsqueda difusa del sitio: sin acentos, con sinónimos (es/en), tolerante a errores de tipeo y con ranking por campo. */

export type SearchEntry = {
  id: string
  type: "page" | "token"
  group: string // Foundations, Componentes, Patrones, Empezar, Tokens
  title: string
  path: string
  /** Ruta de migas, ej. "Componentes › Button". */
  crumb: string
  /** Alias, nombres de stories, etc. */
  keywords?: string
  desc?: string
  /** Solo tokens: valor resuelto. */
  value?: string
}

export type Hit = { entry: SearchEntry; score: number }

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Sinónimos: lo que se escribe en español (o variantes) → términos que existen en el sitio. */
const SYN: Record<string, string[]> = {
  boton: ["button"], botones: ["button"], campo: ["input", "field"], campos: ["input", "field"], formulario: ["input", "form"], texto: ["text", "input"],
  etiqueta: ["badge", "chip"], insignia: ["badge"], cantidad: ["stepper"], contador: ["counter", "stepper"], pestana: ["tabs"], pestanas: ["tabs"], solapa: ["tabs"],
  navegacion: ["nav", "breadcrumb"], migas: ["breadcrumb"], tarjeta: ["card"], carrito: ["cart"], envio: ["shipping"], pago: ["payment"],
  fuente: ["typography", "font"], tipografia: ["typography", "font"], letra: ["font", "typography"], espaciado: ["spacing", "space"], espacio: ["spacing", "space"], margen: ["spacing", "space"],
  sombra: ["shadow", "elevation"], capa: ["layer", "z-index"], capas: ["layer"], animacion: ["motion", "duration"], transicion: ["motion", "duration"],
  borde: ["border"], bordes: ["border"], radio: ["radius"], esquina: ["radius"], progreso: ["progress"], barra: ["progress", "bar"], acordeon: ["accordion"],
  enlace: ["link"], vinculo: ["link"], icono: ["icon"], iconos: ["icon"], titulo: ["heading", "header"], buscador: ["search"], cupon: ["coupon"], descuento: ["coupon", "discount"],
  pedido: ["order"], producto: ["product"], pie: ["footer"], portada: ["hero"], aviso: ["callout"], dialogo: ["modal"], ventana: ["modal"], panel: ["drawer"], lateral: ["drawer"],
  vacio: ["empty"], esqueleto: ["skeleton"], carga: ["skeleton", "loading"], puntaje: ["rating"], calificacion: ["rating"], logo: ["logo"], rojo: ["red"], verde: ["green"], azul: ["blue", "brand"],
  gris: ["neutral"], oscuro: ["inverse"], claro: ["subtle"], hover: ["hover"], desactivado: ["disabled"], deshabilitado: ["disabled"], foco: ["focus"], contraste: ["contrast", "a11y"],
  accesibilidad: ["a11y", "accessibility"], empezar: ["get started", "install"], instalar: ["install", "tokens"],
}

function levenshtein(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

/** Puntaje de un término contra un texto ya normalizado (0 = no coincide). */
function termScore(term: string, text: string): number {
  if (!text) return 0
  const words = text.split(/[^a-z0-9#.]+/).filter(Boolean)
  if (words.includes(term)) return 100
  if (words.some((w) => w.startsWith(term))) return 80
  if (text.includes(term)) return 55
  if (term.length >= 5) {
    // tolerancia a errores de tipeo: 1 letra (2 si el término es largo)
    const tol = term.length >= 8 ? 2 : 1
    if (words.some((w) => levenshtein(term, w.slice(0, term.length + 1), tol) <= tol || levenshtein(term, w, tol) <= tol)) return 35
  }
  return 0
}

const WEIGHT = { title: 3, keywords: 2, crumb: 1, desc: 0.8, value: 1.2 }

type Prepared = { e: SearchEntry; title: string; keywords: string; crumb: string; desc: string; value: string }
const cache = new WeakMap<SearchEntry[], Prepared[]>()
const prepare = (entries: SearchEntry[]) => {
  let p = cache.get(entries)
  if (!p) {
    p = entries.map((e) => ({ e, title: norm(e.title.replace(/^--/, "")).replace(/-/g, " "), keywords: norm(e.keywords ?? ""), crumb: norm(e.crumb), desc: norm(e.desc ?? ""), value: norm(e.value ?? "") }))
    cache.set(entries, p)
  }
  return p
}

export function search(entries: SearchEntry[], query: string, limit = 40): Hit[] {
  const q = norm(query).trim()
  if (!q) return []
  const terms = q.split(/\s+/).map((t) => t.replace(/^--/, "").replace(/-/g, " ")).flatMap((t) => t.split(" ")).filter(Boolean)
  if (terms.length === 0) return []
  const hits: Hit[] = []
  for (const p of prepare(entries)) {
    let total = 0
    let ok = true
    for (const t of terms) {
      const variants = [t, ...(SYN[t] ?? [])]
      let best = 0
      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi]
        // el término escrito vale 1; el primer sinónimo 0.95 y los siguientes un poco menos
        const w = vi === 0 ? 1 : Math.max(0.6, 0.95 - 0.1 * (vi - 1))
        const s = Math.max(
          termScore(v, p.title) * WEIGHT.title,
          termScore(v, p.keywords) * WEIGHT.keywords,
          termScore(v, p.crumb) * WEIGHT.crumb,
          termScore(v, p.desc) * WEIGHT.desc,
          termScore(v, p.value) * WEIGHT.value,
        )
        best = Math.max(best, s * w)
      }
      if (best === 0) { ok = false; break }
      total += best
    }
    if (!ok) continue
    if (p.title === q.replace(/-/g, " ")) total += 400
    else if (p.title.startsWith(terms[0])) total += 60
    if (p.e.type === "page") total += 25 // las páginas ganan a los tokens ante un empate
    hits.push({ entry: p.e, score: total })
  }
  return hits.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title)).slice(0, limit)
}

/** Parte del título que coincide con el primer término (para resaltar). Los índices valen para el título original. */
export function matchRange(title: string, query: string): [number, number] | null {
  const t = norm(title)
  for (const raw of norm(query).split(/\s+/).filter(Boolean)) {
    const term = raw.replace(/^--/, "")
    const i = t.indexOf(term)
    if (i >= 0) return [i, i + term.length]
  }
  return null
}
