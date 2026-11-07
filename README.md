# ds-docs-theme

Theme genérico para documentar sistemas de diseño (Next.js + Tailwind 4 + shadcn/base-ui): header, menús, buscador, tarjetas, tablas, pestañas y vistas de **foundations**, **componentes** y **patrones**.
El theme define el diseño; cada proyecto le entrega su data.

## Ver el theme solo

```bash
npm install
npm run dev      # http://localhost:3400 (playground con data ficticia «Acme»)
```

El playground (`playground/`) es un proyecto de ejemplo: su data vive en `playground/lib/project.tsx` y sus tokens en `playground/data/tokens.css`.

## Qué pone cada proyecto

| Data | Cómo entra |
|---|---|
| Marca (logo, nombre) y navegación superior | props de `SiteHeader` |
| Foundations, componentes y patrones | `NavSection[]` y `Piece[]` (ver `src/types.ts`) |
| Tokens | `readTokens(rutaAlCss)` de `lib/tokens` |
| Color de marca, verde/rojo de «sí / no» y fuentes | variables `--brand`, `--success`, `--danger`, `--doc-font-sans`, `--doc-font-mono` en el `<html>` |
| Iconos de enlaces e ilustraciones | `public/github.svg`, `storybook.svg`, `figma.svg` e `illustrations/<grupo>/<slug>.svg` |
| Búsqueda | `buildSearchIndex` de `lib/search-index` |

## Modos de preview

- **`inline`** (`inlinePreviews`): el componente real se dibuja en la caja; cada vista trae su `node`. Rápido.
- **`storybook`** (`storybookPreviews`): iframes a un Storybook publicado, con inspector y anatomía. Para proyectos con CSS global que no se puede mezclar con la documentación.

### Modo aislado (shadow DOM)

Cuando el CSS del proyecto no se puede mezclar con el del theme (por ejemplo, una tienda con su propio Tailwind 3), cada vista se envuelve en `<Isolated css={["/shop.css"]}>` (`docs/isolated`):

- El CSS del proyecto se compila aparte y se carga **solo dentro del shadow root**; no pisa al theme ni al revés.
- Los tokens (variables CSS en `:root`) y las fuentes cargadas en la página sí llegan adentro: deben estar a nivel documento.
- Los hijos son componentes de React normales (eventos y estado funcionan).
- Inspeccionar y Anatomía leen dentro del shadow root, incluido el rastreo de tokens. Ver la pieza «Botón de la tienda (aislado)» del playground.
- En `html`/`body` del CSS del proyecto no hay efecto dentro de un shadow root: esos estilos pasan a `:host`.

## Usarlo en un proyecto

1. Instalar el paquete y agregar `transpilePackages: ["ds-docs-theme"]` en `next.config`.
2. En `globals.css`: `@import "ds-docs-theme/theme.css";`
3. Montar las páginas como en `playground/app/`.
4. Envolver el layout con `TooltipProvider` (lo usan el copiado de tokens y el inspector).
