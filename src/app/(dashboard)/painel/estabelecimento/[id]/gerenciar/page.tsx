'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import EditarEstabelecimentoForm from '../editar/EditarEstabelecimentoForm'
import EstadoCarregamento from './EstadoCarregamento'
import { useEstabelecimentoGerenciar } from './useEstabelecimentoGerenciar'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function statusBadge(estabelecimento: { status: string; ativo: boolean | null }) {
  if (estabelecimento.status === 'em_analise') {
    return { label: '🕒 Em análise', bg: 'bg-amber-50', text: 'text-amber-700' }
  }
  if (estabelecimento.status === 'blocked') {
    return { label: '🚫 Bloqueado', bg: 'bg-red-50', text: 'text-red-700' }
  }
  if (estabelecimento.ativo === false) {
    return { label: '🙈 Oculto', bg: 'bg-gray-100', text: 'text-gray-600' }
  }
  return { label: '✅ Ativo', bg: 'bg-green-50', text: 'text-green-700' }
}

export default function GerenciarEstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [contaAberta, setContaAberta] = useState(false)
  const [temHorarios, setTemHorarios] = useState(false)

  const {
    router,
    supabase,
    estabelecimento,
    usuarioLogadoId,
    usuarioNome,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
    emAnalise,
  } = useEstabelecimentoGerenciar(id)

  useEffect(() => {
    if (!estabelecimento) return
    supabase
      .from('horarios_funcionamento')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimento.id)
      .then(({ count }: { count: number | null }) => setTemHorarios((count || 0) > 0))
  }, [estabelecimento, supabase])

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const primeiroNome = usuarioNome.split(' ')[0] || usuarioNome
  const badge = statusBadge(estabelecimento)
  const gestaoAtivado = !!estabelecimento.gestao_modulo_ativado

  // Checklist de progresso do perfil público — cada item aponta pro lugar
  // onde dá pra resolver aquilo. "Descrição" mora no próprio modal Conta
  // desta página (não precisa navegar); o resto vive dentro do módulo
  // Cardápio (Configurações → Galeria/Horários).
  const itensChecklist = [
    {
      id: 'descricao',
      label: 'Escrever descrição',
      feito: !!estabelecimento.descricao,
      onClick: () => setContaAberta(true),
    },
    {
      id: 'foto_capa',
      label: 'Foto de capa adicionada',
      feito: !!estabelecimento.foto_capa,
      href: `/painel/estabelecimento/${id}/gerenciar/cardapio`,
    },
    {
      id: 'logo',
      label: 'Logo adicionado',
      feito: !!estabelecimento.logo_url,
      href: `/painel/estabelecimento/${id}/gerenciar/cardapio`,
    },
    {
      id: 'galeria',
      label: 'Fotos na galeria',
      feito: (estabelecimento.galeria_fotos?.length || 0) > 0,
      href: `/painel/estabelecimento/${id}/gerenciar/cardapio`,
    },
    {
      id: 'horarios',
      label: 'Configurar horários',
      feito: temHorarios,
      href: `/painel/estabelecimento/${id}/gerenciar/cardapio`,
    },
  ]
  const feitos = itensChecklist.filter((i) => i.feito).length

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-6xl">
        {emAnalise && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="text-xl">🕒</span>
            <span>
              Sua reivindicação está em análise. Esta página fica <strong>oculta ao público</strong> até
              a aprovação (até 5 dias úteis) — aproveite pra completar os dados e o cardápio.
            </span>
          </div>
        )}

        {/* Cabeçalho — mesma estrutura do /painel: cartão único, título/
            identificação à esquerda, ação/status à direita. */}
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push('/painel')}
              aria-label="Voltar ao painel"
              className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-orange-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">
                {saudacao()}, {primeiroNome}
              </p>
              {ehDonoOuGerente ? (
                <button
                  onClick={() => setContaAberta(true)}
                  className="flex items-center gap-1 text-lg font-bold tracking-tight text-neutral-900 transition hover:text-orange-600"
                  title="Ver e editar dados da conta"
                >
                  <span className="truncate">{nomeExibicao}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              ) : (
                <h1 className="truncate text-lg font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {/* Módulos de primeiro nível — agora são destinos de navegação,
            não abas que trocam conteúdo nesta mesma tela. */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href={`/painel/estabelecimento/${id}/gerenciar/cardapio`}
            className="group flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                🍽️
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Cardápio</h3>
                <p className="text-sm text-neutral-500">Itens, promoções, QR Code, tema e equipe</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 transition group-hover:text-orange-500" />
          </Link>

          {gestaoAtivado ? (
            <Link
              href={`/painel/estabelecimento/${id}/gerenciar/gestao`}
              className="group flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                  🛠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Gestão</h3>
                  <p className="text-sm text-neutral-500">Pedidos, estoque, caixa e fornecedores</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 transition group-hover:text-orange-500" />
            </Link>
          ) : (
            <div
              aria-disabled="true"
              title="Módulo de Gestão desativado — ative em Cardápio → Configurações → Módulo de Gestão"
              className="flex cursor-not-allowed items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 p-6 opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
                  🛠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-400">Gestão</h3>
                  <p className="text-sm text-neutral-400">Pedidos, estoque, caixa e fornecedores</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
            </div>
          )}
        </div>

        {/* Início do estabelecimento — checklist de progresso do perfil
            público + reserva de espaço pra métricas futuras. */}
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">📋 Complete seu perfil público</h2>
            <span className="text-sm font-medium text-neutral-500">
              {feitos}/{itensChecklist.length}
            </span>
          </div>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${(feitos / itensChecklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2.5">
            {itensChecklist.map((item) => {
              const conteudo = (
                <>
                  {item.feito ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-neutral-300" />
                  )}
                  <span className={item.feito ? 'text-neutral-400 line-through' : 'text-neutral-700'}>
                    {item.label}
                  </span>
                </>
              )
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} className="flex items-center gap-2 text-sm transition hover:text-orange-600">
                      {conteudo}
                    </Link>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className="flex items-center gap-2 text-sm transition hover:text-orange-600"
                    >
                      {conteudo}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Métricas — espaço reservado, sem dado real ainda. */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-neutral-900">📈 Métricas</h2>
          <div className="grid grid-cols-3 gap-4">
            {['Visualizações', 'Scans de QR Code', 'Pedidos'].map((label) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-4 text-center opacity-50">
                <p className="text-2xl font-bold text-neutral-400">—</p>
                <p className="mt-1 text-xs text-neutral-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {contaAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setContaAberta(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="font-semibold text-gray-900">Conta</h2>
              <button
                onClick={() => setContaAberta(false)}
                className="text-xl leading-none text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <EditarEstabelecimentoForm
                estabelecimento={estabelecimento}
                podeEditar={podeEditar}
                userId={usuarioLogadoId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
