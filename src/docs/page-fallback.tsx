import { Skeleton } from "../ui/skeleton"

/** Esqueleto que se ve un instante mientras llegan los datos de la ruta (`params`) de una página de detalle. */
export function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
