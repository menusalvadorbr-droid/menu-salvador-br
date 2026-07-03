import { createClient } from '@/lib/supabase/server'
import SecoesEstabelecimentoForm from './SecoesEstabelecimentoForm'
import PaletaPlataformaForm from './PaletaPlataformaForm'

export default async function ConfiguracoesAdminPage() {
  const supabase = await createClient()

  const { data: secoes } = await supabase
    .from('secoes_estabelecimento_config')
    .select('*')
    .order('ordem', { ascending: true })

  const { data: paleta } = await supabase
    .from('configuracoes_plataforma')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Configurações da plataforma</h1>
        <p className="mt-1 text-sm text-neutral-500">Regras que valem para todos os estabelecimentos.</p>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">Seções da página do estabelecimento</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Liga, desliga e ordena o que aparece na página pública de todos os estabelecimentos.
        </p>
        <div className="mt-4">
          <SecoesEstabelecimentoForm secoesIniciais={secoes || []} />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">Paleta da plataforma</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Aplicada em botões, links e destaques do site (fora do cardápio de cada estabelecimento).
        </p>
        <div className="mt-4">
          <PaletaPlataformaForm
            corPrimariaInicial={paleta?.cor_primaria || '#EA580C'}
            corSecundariaInicial={paleta?.cor_secundaria || '#DC2626'}
          />
        </div>
      </div>
    </div>
  )
}
