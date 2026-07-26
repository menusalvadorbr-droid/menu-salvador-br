import { createClient } from '@/lib/supabase/server'

/**
 * Busca uma propaganda ativa E dentro do período agendado (se houver
 * data_inicio/data_fim). Antes os únicos componentes de propaganda do
 * projeto estavam presos em /cidade/[id] e /cidade/bairro/[id], que
 * dependem de tabelas que não existem no banco real (cidades,
 * secoes_publicas) — nunca chegavam a aparecer pra ninguém. Esse
 * componente busca direto na tabela `propagandas` real e é usado nas
 * páginas que de fato têm tráfego (home, por enquanto).
 */
export default async function PropagandaCard() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: propagandas } = await supabase
    .from('propagandas')
    .select('*')
    .eq('ativa', true)
    .order('ordem', { ascending: true })
    .limit(10)

  const propaganda = (propagandas || []).find((p) => {
    if (p.data_inicio && p.data_inicio > hoje) return false
    if (p.data_fim && p.data_fim < hoje) return false
    return true
  })

  if (!propaganda) return null

  const conteudo = (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      {propaganda.imagem && (
        <img
          src={propaganda.imagem}
          alt={propaganda.titulo}
          className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          Publicidade
        </span>
        <p className="truncate text-sm font-semibold text-neutral-900">{propaganda.titulo}</p>
        {propaganda.descricao && (
          <p className="line-clamp-1 text-xs text-neutral-500">{propaganda.descricao}</p>
        )}
      </div>
    </div>
  )

  if (!propaganda.link) return conteudo

  return (
    <a href={propaganda.link} target="_blank" rel="noopener noreferrer sponsored" className="block">
      {conteudo}
    </a>
  )
}
