/**
 * Placeholder pulsante nas mesmas dimensões do EstablishmentCard real
 * (imagem h-44, padding p-4, mesmas linhas de título/bairro/tags/
 * descrição) — evita o "pulo" de layout quando os cards de verdade
 * chegam, e é bem mais claro que tela em branco ou spinner enquanto uma
 * seção ainda está buscando dados.
 */
export default function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="h-44 w-full animate-pulse bg-neutral-100" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-neutral-100" />
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
        <div className="mt-auto h-3 w-24 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  )
}
