import { createClient } from '@/lib/supabase/server'
import SecoesEstabelecimentoForm from './SecoesEstabelecimentoForm'
import PaletaPlataformaForm from './PaletaPlataformaForm'
import ConfiguracoesHomeForm, { type ConfiguracoesHome } from './ConfiguracoesHomeForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

const CONFIG_HOME_PADRAO: ConfiguracoesHome = {
  hero_ativado: true,
  promocoes_ativado: true,
  grid_estabelecimentos_ativado: true,
  filtros_ativado: true,
  botao_flutuante_ativado: true,
}

export default async function ConfiguracoesAdminPage() {
  const supabase = await createClient()

  const [{ data: settings }, { data: configHome }] = await Promise.all([
    supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['secoes_estabelecimento', 'paleta_plataforma']),
    supabase.from('configuracoes_home').select('*').eq('id', true).maybeSingle(),
  ])

  const secoes = settings?.find((s) => s.key === 'secoes_estabelecimento')?.value || []
  const paleta = settings?.find((s) => s.key === 'paleta_plataforma')?.value || {}

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        titulo="Configurações da plataforma"
        descricao="Regras que valem para todos os estabelecimentos."
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">Seções da home (menu.salvador)</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Liga e desliga o que aparece na página inicial do diretório — não afeta a página de cada estabelecimento.
        </p>
        <div className="mt-4">
          <ConfiguracoesHomeForm configInicial={{ ...CONFIG_HOME_PADRAO, ...(configHome || {}) }} />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">Seções da página do estabelecimento</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Liga, desliga e ordena o que aparece na página pública de todos os estabelecimentos.
        </p>
        <div className="mt-4">
          <SecoesEstabelecimentoForm secoesIniciais={secoes} />
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
