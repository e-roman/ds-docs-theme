import type { PreviewAdapter } from "../types"

/**
 * Adaptador para proyectos con Storybook publicado.
 * `livePath` es el prefijo de mismo origen con el que el proyecto reescribe (rewrite) el Storybook, para poder inspeccionar las stories embebidas.
 */
export function storybookPreviews(o: { url: string; repo: string; livePath?: string; sourcePath?: (file: string) => string }): PreviewAdapter {
  const live = o.livePath ?? "/sb"
  return {
    mode: "storybook",
    liveUrl: (id) => `${live}/iframe.html?id=${id}&viewMode=story&embed=1`,
    storyUrl: (id) => `${o.url}/?path=/story/${id}`,
    docsUrl: (id) => `${o.url}/?path=/docs/${id}`,
    sourceUrl: o.sourcePath ?? ((file) => `${o.repo}/blob/main/${file}`),
  }
}

/** Adaptador para proyectos que dibujan el componente real en la caja (cada `Story` trae su `node`). */
export function inlinePreviews(o: { repo: string; sourceUrl?: (file: string) => string; storyUrl?: (id: string) => string; docsUrl?: (id: string) => string }): PreviewAdapter {
  return {
    mode: "inline",
    liveUrl: () => "",
    storyUrl: o.storyUrl ?? (() => ""),
    docsUrl: o.docsUrl ?? (() => ""),
    sourceUrl: o.sourceUrl ?? ((file) => `${o.repo}/blob/main/${file}`),
  }
}
