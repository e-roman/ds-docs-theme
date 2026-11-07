import { DoDont, PageHeader, PropsTable, Section, WhenToUse } from "./blocks"
import { DocTabs } from "./doc-tabs"
import { AnatomyView } from "./anatomy-view"
import { InspectDrawer } from "./inspector"
import { LiveVariants } from "./live-variants"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { contrast } from "../lib/contrast"
import { findToken } from "../lib/tokens"
import type { ExternalLinks, Piece, PreviewAdapter, Token } from "../types"

/** Texto con `código` entre backticks. */
const fmt = (s: string) => s.split("`").map((p, i) => (i % 2 ? <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{p}</code> : p))

const Kbd = ({ children }: { children: string }) => <kbd className="rounded border border-b-2 bg-background px-1.5 py-0.5 font-mono text-xs font-semibold">{children}</kbd>

/** Relación de contraste de un par de tokens. Texto: 4.5:1 (WCAG AA). Íconos y gráficos: 3:1. */
function Ratio({ tokens, fg, bg, min = 4.5 }: { tokens: Token[]; fg: string; bg: string; min?: number }) {
  const a = findToken(tokens, fg)?.resolved
  const b = findToken(tokens, bg)?.resolved
  const r = a && b ? contrast(a, b) : null
  if (r === null) return <span className="text-muted-foreground">—</span>
  const ok = r >= min
  return <span className={`font-semibold ${ok ? "text-success" : "text-danger"}`}>{r.toFixed(2)}:1 {ok ? "OK" : "No AA"}</span>
}

/** Página de un componente o patrón, con las pestañas Diseño, Uso, Accesibilidad e Historial. */
export function PieceView({ piece, tokens, preview, links }: { piece: Piece; tokens: Token[]; preview: PreviewAdapter; /** Enlaces externos de la página; GitHub y Storybook de la pieza los pone el adaptador. */ links?: Pick<ExternalLinks, "figma"> }) {
  const inline = preview.mode === "inline"
  const hasA11y = Boolean(piece.a11y?.length || piece.keyboard?.length || piece.contrast?.length)
  return (
    <article>
      <InspectDrawer />
      <PageHeader title={piece.title} description={piece.description} links={{ github: preview.sourceUrl(piece.file), storybook: inline ? undefined : preview.docsUrl(piece.docsId), figma: links?.figma }} />
      <DocTabs
        panels={{
          design: (
            <>
              {piece.anatomy && (
                <Section title="Anatomía" intro="Cada número es una parte del componente real: hacé clic para ver sus propiedades y tokens.">
                  <AnatomyView title={piece.title} src={preview.liveUrl(piece.anatomy.story)} anatomy={piece.anatomy} />
                </Section>
              )}
              <Section title="Variantes" intro="El componente real, en vivo. Con «Inspeccionar» ves las propiedades y los tokens de cada parte.">
                {piece.stories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este componente no dibuja nada en pantalla, así que no tiene vista previa.{inline ? "" : " Podés probarlo en su story de Storybook."}</p>
                ) : (
                  <LiveVariants title={piece.title} items={piece.stories.map((s) => ({ label: s.label, id: s.id, src: preview.liveUrl(s.id), href: preview.storyUrl(s.id), width: s.width, node: s.node }))} />
                )}
              </Section>
              <Section title="Props"><PropsTable props={piece.props} /></Section>
            </>
          ),
          usage: (
            <>
              <Section title="Cuándo usarlo y cuándo evitarlo">
                <WhenToUse use={piece.use} avoid={piece.avoid} />
              </Section>
              {piece.practices && piece.practices.length > 0 && (
                <Section title="Buenas prácticas">
                  <DoDont items={piece.practices.map((p) => ({ ok: p.ok, title: p.title, text: p.text, storyId: p.storyId, src: preview.liveUrl(p.storyId) }))} />
                </Section>
              )}
            </>
          ),
          accessibility: hasA11y ? (
            <>
              {piece.a11y?.length ? (
                <Section title="Rol y estructura" intro="Lo que ya resuelve el componente, verificado en su código.">
                  <ul className="list-disc space-y-2 pl-5 text-sm">{piece.a11y.map((t) => <li key={t}>{fmt(t)}</li>)}</ul>
                </Section>
              ) : null}
              {piece.keyboard?.length ? (
                <Section title="Teclado">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-56">Tecla</TableHead><TableHead>Acción</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {piece.keyboard.map((k) => (
                        <TableRow key={k.keys.join("")}>
                          <TableCell>
                            <span className="flex flex-wrap items-center gap-1.5">
                              {k.keys.map((key, i) => (
                                <span key={key} className="flex items-center gap-1.5">{i > 0 && <span className="text-muted-foreground">/</span>}<Kbd>{key}</Kbd></span>
                              ))}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-normal text-sm">{k.action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Section>
              ) : null}
              {piece.contrast?.length ? (
                <Section title="Contraste">
                  <Table>
                    <TableHeader><TableRow><TableHead>Elemento</TableHead><TableHead>Colores</TableHead><TableHead className="w-40">Relación</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {piece.contrast.map((c) => (
                        <TableRow key={c.element}>
                          <TableCell className="whitespace-normal text-sm">{c.element}</TableCell>
                          <TableCell className="whitespace-normal font-mono text-xs text-muted-foreground">{c.fg} sobre {c.bg}</TableCell>
                          <TableCell className="text-sm"><Ratio tokens={tokens} fg={c.fg} bg={c.bg} min={c.min} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-sm text-muted-foreground">Texto: 4.5:1 (WCAG 1.4.3). Los íconos son componentes gráficos: mínimo 3:1 (WCAG 1.4.11). Los pares salen de los tokens que aplica el CSS de la tienda.</p>
                </Section>
              ) : null}
            </>
          ) : undefined,
          updates: piece.history?.length ? (
            <Section title="Cambios del componente">
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="w-32">Fecha</TableHead><TableHead>Cambio</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {[...piece.history].sort((a, b) => b.date.localeCompare(a.date)).map((h) => (
                    <TableRow key={h.date + h.text}>
                      <TableCell className="align-top font-mono text-xs">{h.date}</TableCell>
                      <TableCell className="whitespace-normal text-sm">{fmt(h.text)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          ) : undefined,
        }}
      />
    </article>
  )
}
