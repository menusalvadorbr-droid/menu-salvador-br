import { obterAvaliacoesGoogle } from '@/lib/googlePlaces'

function Estrelas({ nota }: { nota: number }) {
  return (
    <span aria-label={`${nota} de 5 estrelas`}>
      {'★'.repeat(Math.round(nota))}
      <span className="text-neutral-300">{'★'.repeat(5 - Math.round(nota))}</span>
    </span>
  )
}

export default async function SecaoAvaliacoesGoogle({ estabelecimentoId }: { estabelecimentoId: string }) {
  const resumo = await obterAvaliacoesGoogle(estabelecimentoId)

  if (!resumo || resumo.notaMedia == null) return null

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-neutral-800">⭐ Avaliações do Google</h2>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl font-bold text-neutral-900">{resumo.notaMedia.toFixed(1)}</span>
        <div>
          <div className="text-lg text-amber-500">
            <Estrelas nota={resumo.notaMedia} />
          </div>
          <p className="text-xs text-neutral-500">
            {resumo.totalAvaliacoes ?? 0} avaliações via Google
          </p>
        </div>
      </div>

      {resumo.avaliacoes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {resumo.avaliacoes.map((avaliacao, i) => (
            <div
              key={i}
              className="w-64 flex-shrink-0 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                {avaliacao.autorFotoUrl && (
                  <img src={avaliacao.autorFotoUrl} alt="" className="h-6 w-6 rounded-full" />
                )}
                <span className="truncate text-xs font-medium text-neutral-700">{avaliacao.autor}</span>
              </div>
              <div className="mb-1 text-xs text-amber-500">
                <Estrelas nota={avaliacao.nota} />
              </div>
              <p className="line-clamp-4 text-xs text-neutral-600">{avaliacao.texto}</p>
              <p className="mt-1 text-[10px] text-neutral-400">{avaliacao.tempoRelativo}</p>
            </div>
          ))}
        </div>
      )}

      {/* Atribuição obrigatória pelas políticas do Google */}
      <p className="mt-3 text-[10px] text-neutral-400">
        Avaliações fornecidas pelo{' '}
        <a
          href={`https://www.google.com/maps/place/?q=place_id:${resumo.placeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Google
        </a>
      </p>
    </div>
  )
}
