import { createClient } from '@/lib/supabase/server'
import TiposManager from './TiposManager'
import type { TipoItem } from './TiposManager'
import { criarTipoEstabelecimento, toggleTipoEstabelecimento, editarTipoEstabelecimento, excluirTipoEstabelecimento, criarTipoCozinha, toggleTipoCozinha, editarTipoCozinha, excluirTipoCozinha } from './actions'
import BairrosManager from '../bairros/BairrosManager'
import type { BairroComContagem } from '../bairros/BairrosManager'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminAcordeaoSecao from '@/components/admin/AdminAcordeaoSecao'

export default async function AdminTiposPage() {
  const supabase = await createClient()

  const [
    { data: tiposEstabelecimento },
    { data: tiposCozinha },
    { data: estabelecimentosPorTipo },
    { data: vinculosCozinha },
    { data: bairros },
    { data: estabelecimentosPorBairro },
  ] = await Promise.all([
    supabase.from('tipos_estabelecimento').select('id, nome, slug, icone, ativo').order('ordem'),
    supabase.from('tipos_cozinha').select('id, nome, slug, icone, ativo').order('ordem'),
    supabase.from('estabelecimentos').select('tipo_estabelecimento').not('tipo_estabelecimento', 'is', null),
    supabase.from('estabelecimento_tipos_cozinha').select('tipo_cozinha_id'),
    supabase.from('bairros').select('id, nome, slug, icone').order('nome'),
    supabase.from('estabelecimentos').select('bairro_id').not('bairro_id', 'is', null),
  ])

  const contagemPorSlug = new Map<string, number>()
  for (const linha of estabelecimentosPorTipo || []) {
    const slug = linha.tipo_estabelecimento
    if (slug) contagemPorSlug.set(slug, (contagemPorSlug.get(slug) || 0) + 1)
  }

  const contagemPorCozinhaId = new Map<number, number>()
  for (const linha of vinculosCozinha || []) {
    contagemPorCozinhaId.set(linha.tipo_cozinha_id, (contagemPorCozinhaId.get(linha.tipo_cozinha_id) || 0) + 1)
  }

  const itensEstabelecimento: TipoItem[] = (tiposEstabelecimento || []).map((t) => ({
    ...t,
    totalEmUso: contagemPorSlug.get(t.slug) || 0,
  }))

  const itensCozinha: TipoItem[] = (tiposCozinha || []).map((t) => ({
    ...t,
    totalEmUso: contagemPorCozinhaId.get(t.id) || 0,
  }))

  const contagemPorBairro = new Map<string, number>()
  for (const linha of estabelecimentosPorBairro || []) {
    if (linha.bairro_id) contagemPorBairro.set(linha.bairro_id, (contagemPorBairro.get(linha.bairro_id) || 0) + 1)
  }
  const bairrosComContagem: BairroComContagem[] = (bairros || []).map((b) => ({
    ...b,
    totalEstabelecimentos: contagemPorBairro.get(b.id) || 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        titulo="Tipos e bairros"
        descricao="Essas listas aparecem no cadastro e na edição de qualquer estabelecimento, e nos filtros da home."
      />

      <AdminAcordeaoSecao
        titulo="Tipos de estabelecimento"
        contador={`${itensEstabelecimento.length} itens`}
        abertoInicialmente
      >
        <TiposManager
          descricao="Ex: restaurante, bar, lanchonete. Desativar não afeta quem já está com esse tipo — só some da lista pra escolher em novos cadastros."
          placeholderNome="Ex: Sorveteria"
          itensIniciais={itensEstabelecimento}
          onCriar={criarTipoEstabelecimento}
          onToggle={toggleTipoEstabelecimento}
          onEditar={editarTipoEstabelecimento}
          onExcluir={excluirTipoEstabelecimento}
        />
      </AdminAcordeaoSecao>

      <AdminAcordeaoSecao titulo="Tipos de culinária" contador={`${itensCozinha.length} itens`}>
        <TiposManager
          descricao="Aparecem na faixa de ícones da home e na caixa de seleção (até 3) do cadastro de culinária."
          placeholderNome="Ex: Culinária árabe"
          itensIniciais={itensCozinha}
          onCriar={criarTipoCozinha}
          onToggle={toggleTipoCozinha}
          onEditar={editarTipoCozinha}
          onExcluir={excluirTipoCozinha}
        />
      </AdminAcordeaoSecao>

      <AdminAcordeaoSecao titulo="Bairros" contador={`${bairrosComContagem.length} itens`}>
        <p className="text-xs text-neutral-400">
          Lista de bairros disponível pra todos os donos de estabelecimento escolherem no cadastro.
        </p>
        <div className="mt-4">
          <BairrosManager bairrosIniciais={bairrosComContagem} />
        </div>
      </AdminAcordeaoSecao>
    </div>
  )
}
