export default function SecaoExpansivel({
  titulo,
  resumo,
  children,
  abertoPorPadrao,
}: {
  titulo: string
  resumo: React.ReactNode
  children: React.ReactNode
  abertoPorPadrao?: boolean
}) {
  return (
    <details
      className="group rounded-2xl border border-neutral-100 bg-white shadow-sm open:shadow-md"
      open={abertoPorPadrao}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{titulo}</p>
          <div className="mt-0.5 truncate text-xs text-neutral-500">{resumo}</div>
        </div>
        <span className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition group-open:bg-neutral-900 group-open:text-white">
          <span className="group-open:hidden">Abrir</span>
          <span className="hidden group-open:inline">Fechar</span>
        </span>
      </summary>
      <div className="border-t border-neutral-100 p-5">{children}</div>
    </details>
  )
}
