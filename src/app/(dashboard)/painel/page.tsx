import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/logError'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, LogOut, Shield, ExternalLink, Eye, EyeOff, Trash2, Settings } from 'lucide-react'
import { ExcluirEstabelecimentoButton } from './components/ExcluirEstabelecimentoButton'
import { handleLogout, toggleOcultar, excluirEstabelecimento } from './actions'

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
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profileError && profile) {
    isSuperAdmin = profile.role === 'super_admin'
  }

  // 3. Buscar estabelecimentos do dono
  const { data: estabelecimentos, error } = await supabase
    .from('estabelecimentos')
    .select('id, nome, nome_fantasia, slug, status, foto_capa, ativo, bairro, tipo_cozinha')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('Erro ao buscar estabelecimentos:', error)
  }

  // 4. Buscar estabelecimentos onde o usuário é funcionário (garçom, caixa,
  //    gerente ou cozinha) — não-donos chegam ao painel por aqui.
  const { data: vinculos, error: vinculosError } = await supabase
    .from('funcionarios')
    .select('cargo, estabelecimentos:estabelecimento_id (id, nome, nome_fantasia, slug, status, foto_capa, ativo, bairro, tipo_cozinha)')
    .eq('user_id', user.id)
    .eq('ativo', true)

  if (vinculosError) {
    logSupabaseError('Erro ao buscar vínculos de funcionário:', vinculosError)
  }

  const estabelecimentosComoFuncionario = (vinculos || [])
    .map((v: any) => ({ ...v.estabelecimentos, cargo: v.cargo }))
    .filter((e: any) => e && e.id)

  const CARGO_LABEL: Record<string, string> = {
    gerente: '👔 Gerente',
    caixa: '💰 Caixa',
    garcom: '🍽️ Garçom',
    cozinha: '👨‍🍳 Cozinha',
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-8 h-8" />
                Meus Estabelecimentos
              </h1>
              <p className="text-orange-100 mt-1">
                Bem-vindo, <strong>{user.email}</strong>!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/estabelecimentos/novo"
                className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Novo Estabelecimento
              </Link>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Listagem */}
        {estabelecimentos && estabelecimentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estabelecimentos.map((est) => {
              const nomeExibicao = est.nome_fantasia || est.nome
              const isAtivo = est.ativo !== false && est.status === 'active'

              return (
                <div
                  key={est.id}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border ${
                    isAtivo ? 'border-gray-100 hover:border-orange-200' : 'border-red-100 opacity-70'
                  } group`}
                >
                  {/* Imagem de capa */}
                  {est.foto_capa ? (
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={est.foto_capa}
                        alt={nomeExibicao}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {!isAtivo && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Oculto
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Nome e status */}
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {nomeExibicao}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isAtivo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isAtivo ? '✅ Ativo' : '⛔ Inativo'}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <div className="text-sm text-gray-500 space-y-0.5 mb-4">
                      {est.bairro && <p>📍 {est.bairro}</p>}
                      {est.tipo_cozinha && <p>🍽️ {est.tipo_cozinha}</p>}
                      <p className="text-xs text-gray-400">/{est.slug}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Link
                        href={`/painel/estabelecimento/${est.id}/gerenciar`}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Gerenciar
                      </Link>

                      <div className="flex items-center gap-1">
                        {/* Toggle Ocultar – usando Server Action via formulário */}
                        <form action={toggleOcultar}>
                          <input type="hidden" name="id" value={est.id} />
                          <input type="hidden" name="ativo" value={String(isAtivo)} />
                          <button
                            type="submit"
                            className={`p-2 rounded-lg transition ${
                              isAtivo
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                : 'bg-green-100 hover:bg-green-200 text-green-700'
                            }`}
                            title={isAtivo ? 'Ocultar do diretório' : 'Mostrar no diretório'}
                          >
                            {isAtivo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </form>

                        {/* Botão Excluir – agora é um Client Component */}
                        <ExcluirEstabelecimentoButton
                          estabelecimentoId={est.id}
                          nomeExibicao={nomeExibicao}
                        />

                        <Link
                          href={`/${est.slug}`}
                          target="_blank"
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                          title="Ver página pública"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Você ainda não tem estabelecimentos cadastrados.</p>
            <p className="text-gray-400 text-sm mb-6">Comece agora e crie o cardápio digital do seu restaurante!</p>
            <Link
              href="/estabelecimentos/novo"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Cadastrar meu primeiro estabelecimento
            </Link>
          </div>
        )}

        {/* Estabelecimentos onde o usuário é funcionário (não-dono) */}
        {estabelecimentosComoFuncionario.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6" />
              Onde eu trabalho
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estabelecimentosComoFuncionario.map((est: any) => {
                const nomeExibicao = est.nome_fantasia || est.nome
                return (
                  <div
                    key={est.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200"
                  >
                    {est.foto_capa ? (
                      <div className="h-32 overflow-hidden">
                        <img src={est.foto_capa} alt={nomeExibicao} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{nomeExibicao}</h3>
                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                        {CARGO_LABEL[est.cargo] || est.cargo}
                      </span>
                      <Link
                        href={`/painel/estabelecimento/${est.id}/gerenciar`}
                        className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
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