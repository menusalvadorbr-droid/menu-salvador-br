'use client'

import { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { useRouter } from 'next/navigation'
import TabsContainer from '@/app/(dashboard)/painel/components/TabsContainer'
import CardapioTab from '../editar/CardapioTab'
import QrCodeTab from '../editar/QrCodeTab'
import GaleriaTab from '../editar/GaleriaTab'
import PromocoesTab from '../editar/PromocoesTab'
import EditarEstabelecimentoForm from '../editar/EditarEstabelecimentoForm'
import { TemaEditor } from '@/components/tema'
import ConfiguracoesTab from '../editar/components/ConfiguracoesTab'
import FuncionariosTab from './FuncionariosTab'

export default function GerenciarEstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  // Estabilizar a referência do cliente com useRef para não disparar
  // useEffect toda vez que o componente re-renderizar
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [cargo, setCargo] = useState<string | null>(null) // null = é o dono
  const [acessoNegado, setAcessoNegado] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUsuarioLogadoId(user.id)

      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        logSupabaseError('Erro ao carregar estabelecimento:', error)
        router.push('/painel')
        return
      }

      // Determinar o papel do usuário atual nesse estabelecimento:
      // dono (owner_user_id bate), super_admin (acesso total, sem
      // precisar de vínculo), funcionário (tem vínculo ativo) ou
      // nenhum dos três (acesso negado).
      if (data.owner_user_id === user.id) {
        setCargo(null) // dono enxerga tudo
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role === 'super_admin') {
          setCargo(null) // admin enxerga e edita como se fosse o dono
        } else {
          const { data: vinculo } = await supabase
            .from('funcionarios')
            .select('cargo')
            .eq('estabelecimento_id', id)
            .eq('user_id', user.id)
            .eq('ativo', true)
            .maybeSingle()

          if (!vinculo) {
            setAcessoNegado(true)
            setLoading(false)
            return
          }
          setCargo(vinculo.cargo)
        }
      }

      setEstabelecimento(data)
      setLoading(false)
    }

    carregar()
  }, [id, router])

  if (acessoNegado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-red-600">
        Você não tem acesso a este estabelecimento.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        Carregando...
      </div>
    )
  }

  if (!estabelecimento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-red-600">
        Estabelecimento não encontrado.
      </div>
    )
  }

  // Regras de visibilidade por papel:
  // - Dono (cargo === null) e Gerente: veem e editam tudo, inclusive
  //   dados administrativos do estabelecimento e a equipe.
  // - Caixa e Garçom: só consultam o cardápio (não editam).
  // - Cozinha: só consulta o cardápio também (sem tela de pedidos por
  //   enquanto — a operação de pedidos não está disponível nesse painel).
  const ehDonoOuGerente = cargo === null || cargo === 'gerente'
  const podeEditarCardapio = ehDonoOuGerente
  // Edição fica liberada tanto quando já está público ('active') quanto
  // durante a análise da reivindicação ('em_analise') — é exatamente
  // nesse segundo estado que o dono está preenchendo os dados pela
  // primeira vez. Só fica travado mesmo quando 'blocked'.
  const podeEditar = estabelecimento.status === 'active' || estabelecimento.status === 'em_analise'
  const emAnalise = estabelecimento.status === 'em_analise'

 const tabs = [
  ...(ehDonoOuGerente
    ? [
        {
          id: 'informacoes',
          label: '📋 Informações',
          content: (
            <EditarEstabelecimentoForm
              estabelecimento={estabelecimento}
              podeEditar={podeEditar}
              userId={usuarioLogadoId}
            />
          ),
        },
      ]
    : []),
  {
    id: 'cardapio',
    label: '🍽️ Cardápio',
    content: <CardapioTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditarCardapio} />,
  },
  ...(ehDonoOuGerente
    ? [
        {
          id: 'galeria',
          label: '🖼️ Galeria',
          content: <GaleriaTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
        },
        {
          id: 'promocoes',
          label: '⭐ Promoções',
          content: <PromocoesTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
        },
        {
          id: 'qrcode',
          label: '📱 QR Code',
          content: (
            <QrCodeTab
              estabelecimentoId={estabelecimento.id}
              shortUrl={estabelecimento.qrcode_short_url}
              slug={estabelecimento.slug}
              logoUrl={estabelecimento.logo_url}
            />
          ),
        },
        {
          id: 'configuracoes',
          label: '⚙️ Configurações',
          content: <ConfiguracoesTab estabelecimento={estabelecimento} readOnly={!podeEditar} />,
        },
        {
          id: 'tema',
          label: '🎨 Tema',
          content: (
            <TemaEditor
              estabelecimentoId={estabelecimento.id}
              temaAtualId={estabelecimento.tema_atual_id}
              readOnly={!ehDonoOuGerente}
              onTemaChange={(temaId) => {
                console.log('Tema alterado para:', temaId)
              }}
            />
          ),
        },
      ]
    : []),
] // ← FECHE O ARRAY AQUI

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/painel')}
              className="mb-1 text-sm text-neutral-500 hover:text-orange-600"
            >
              ← Voltar ao painel
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {estabelecimento.nome_fantasia || estabelecimento.nome}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/painel/estabelecimento/${estabelecimento.id}/pedidos`}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              📋 Ver pedidos
            </Link>
            <Link
              href={`/painel/estabelecimento/${estabelecimento.id}/estoque`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              📦 Estoque
            </Link>
            <Link
              href={`/painel/estabelecimento/${estabelecimento.id}/caixa`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              💰 Caixa
            </Link>
            <Link
              href={`/painel/estabelecimento/${estabelecimento.id}/fornecedores`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              🚚 Fornecedores
            </Link>
          </div>
        </div>

        <TabsContainer tabs={tabs} defaultTab={ehDonoOuGerente ? 'informacoes' : 'cardapio'} />
      </div>
    </div>
  )
}