import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/logError'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Shield, Settings } from 'lucide-react'
import { ExcluirEstabelecimentoButton } from './components/ExcluirEstabelecimentoButton'
import BemVindoPainel from './components/BemVindoPainel'
import ListaEstabelecimentosDono from './components/ListaEstabelecimentosDono'
import { toggleOcultar, excluirEstabelecimento } from './actions'

// ============================================================
// TOKENS VISUAIS DO PAINEL
// Paleta inspirada nos azulejos portugueses e telhas de barro do
// Pelourinho — terracota como cor de ação principal, azulejo como
// acento secundário, ocre para o estado "em análise". Mantido só
// nesta página (painel do dono); o resto do site não muda.
// ============================================================
const COR_TERRACOTA = '#C1541F'
const COR_AZULEJO = '#2B5C73'
const COR_OCRE = '#B8860B'
const COR_FUNDO = '#FBF7F0'
const COR_TEXTO = '#2A2420'

// Motivo de azulejo — losangos alternados em baixa opacidade, usado uma
// única vez como faixa de assinatura sob o cabeçalho.
function FaixaAzulejo() {
  return (
    <div
      aria-hidden
      className="h-3 w-full"
      style={{
        backgroundImage: `repeating-linear-gradient(135deg, ${COR_AZULEJO}22 0 10px, transparent 10px 20px), repeating-linear-gradient(45deg, ${COR_TERRACOTA}22 0 10px, transparent 10px 20px)`,
      }}
    />
  )
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default async function PainelPage() {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verificar se é super_admin
  let isSuperAdmin = false
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profileError && profile) {
    isSuperAdmin = profile.role === 'super_admin'
  }

  // 3. Buscar estabelecimentos do dono — exclui status='excluido' (o dono
  //    já pediu pra excluir; a partir daí é fila do admin, não aparece mais
  //    aqui, mesmo que o admin ainda não tenha decidido restaurar ou apagar
  //    de vez).
  const { data: estabelecimentos, error } = await supabase
    .from('estabelecimentos')
    .select('id, nome, nome_fantasia, slug, status, foto_capa, ativo, bairro, estabelecimento_tipos_cozinha(tipos_cozinha(nome))')
    .eq('owner_user_id', user.id)
    .neq('status', 'excluido')
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('Erro ao buscar estabelecimentos:', error)
  }

  // 4. Buscar estabelecimentos onde o usuário é funcionário (garçom, caixa,
  //    gerente ou cozinha) — não-donos chegam ao painel por aqui.
  const { data: vinculos, error: vinculosError } = await supabase
    .from('funcionarios')
    .select('cargo, estabelecimentos:estabelecimento_id (id, nome, nome_fantasia, slug, status, foto_capa, ativo, bairro, estabelecimento_tipos_cozinha(tipos_cozinha(nome)))')
    .eq('user_id', user.id)
    .eq('ativo', true)

  if (vinculosError) {
    logSupabaseError('Erro ao buscar vínculos de funcionário:', vinculosError)
  }

  const estabelecimentosComoFuncionario = (vinculos || [])
    .map((v: any) => ({ ...v.estabelecimentos, cargo: v.cargo }))
    .filter((e: any) => e && e.id && e.status !== 'excluido')

  const CARGO_LABEL: Record<string, string> = {
    gerente: '👔 Gerente',
    caixa: '💰 Caixa',
    garcom: '🍽️ Garçom',
    cozinha: '👨‍🍳 Cozinha',
  }

  // Primeiro acesso de verdade: nada de dono, nada de funcionário. Em
  // vez do card de estado vazio dentro do dashboard cheio, mostra uma
  // tela própria, só com a ação de adicionar o primeiro estabelecimento
  // — sem grid, sem estatística zerada, sem navegação que ainda não
  // serve pra nada.
  if (
    !isSuperAdmin &&
    (!estabelecimentos || estabelecimentos.length === 0) &&
    estabelecimentosComoFuncionario.length === 0
  ) {
    return <BemVindoPainel nome={user.user_metadata?.full_name || user.email || 'tudo bem'} />
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen" style={{ backgroundColor: COR_FUNDO }}>
      {/* Cabeçalho */}
      <div className="text-white" style={{ backgroundColor: COR_TEXTO }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Painel do estabelecimento</p>
              <h1 className="mt-1 text-2xl md:text-[2rem] font-bold tracking-tight flex items-center gap-3">
                <Building2 className="w-7 h-7" style={{ color: COR_TERRACOTA }} />
                Meus estabelecimentos
              </h1>
              <p className="mt-1 text-sm opacity-70">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="border border-white/20 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/estabelecimentos/novo"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 text-white hover:brightness-110"
                style={{ backgroundColor: COR_TERRACOTA }}
              >
                <Plus className="w-4 h-4" />
                Novo estabelecimento
              </Link>
            </div>
          </div>
        </div>
        <FaixaAzulejo />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Listagem */}
        {estabelecimentos && estabelecimentos.length > 0 ? (
          // O TS infere estabelecimento_tipos_cozinha.tipos_cozinha como array pra
          // esse select (sem tipos gerados do Supabase, a inferência de
          // cardinalidade do embed erra) — na prática, é sempre objeto único
          // (cada linha da junção aponta pra um só tipos_cozinha), como o resto
          // do código já assume (ex: EstablishmentCard.tsx). `as any` aqui só
          // pra não brigar com essa inferência errada, mesmo padrão já usado
          // no resto deste arquivo pra resultado de query do Supabase.
          <ListaEstabelecimentosDono estabelecimentos={estabelecimentos as any} toggleOcultar={toggleOcultar} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-black/5">
            <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#D8CFC0' }} />
            <p className="text-lg mb-2" style={{ color: COR_TEXTO }}>Você ainda não tem estabelecimentos cadastrados.</p>
            <p className="text-neutral-400 text-sm mb-6">Comece agora e crie o cardápio digital do seu restaurante!</p>
            <Link
              href="/estabelecimentos/novo"
              className="inline-block text-white px-6 py-3 rounded-lg font-medium transition shadow-sm hover:brightness-110"
              style={{ backgroundColor: COR_TERRACOTA }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Cadastrar meu primeiro estabelecimento
            </Link>
          </div>
        )}

        {/* Estabelecimentos onde o usuário é funcionário (não-dono) */}
        {estabelecimentosComoFuncionario.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-1">Equipe</p>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COR_TEXTO }}>
              <Building2 className="w-5 h-5" style={{ color: COR_AZULEJO }} />
              Onde eu trabalho
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estabelecimentosComoFuncionario.map((est: any) => {
                const nomeExibicao = est.nome_fantasia || est.nome
                return (
                  <div
                    key={est.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-black/5"
                  >
                    {est.foto_capa ? (
                      <div className="h-28 overflow-hidden">
                        <img src={est.foto_capa} alt={nomeExibicao} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center" style={{ backgroundColor: COR_FUNDO }}>
                        <Building2 className="w-10 h-10" style={{ color: '#D8CFC0' }} />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-base font-semibold truncate" style={{ color: COR_TEXTO }}>{nomeExibicao}</h3>
                      <span
                        className="inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ color: COR_AZULEJO, backgroundColor: `${COR_AZULEJO}15` }}
                      >
                        {CARGO_LABEL[est.cargo] || est.cargo}
                      </span>
                      <Link
                        href={`/painel/estabelecimento/${est.id}/gerenciar`}
                        className="mt-4 w-full text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 hover:brightness-110"
                        style={{ backgroundColor: COR_AZULEJO }}
                      >
                        <Settings className="w-4 h-4" />
                        Acessar painel de trabalho
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
