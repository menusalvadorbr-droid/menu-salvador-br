'use client'

import { useEffect, useState, use, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  UtensilsCrossed,
  Settings,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Eye,
  QrCode,
  ShoppingBag,
} from 'lucide-react'
import EstadoCarregamento from './EstadoCarregamento'
import { useEstabelecimentoGerenciar } from './useEstabelecimentoGerenciar'
import CabecalhoGerenciar from './CabecalhoGerenciar'

// Cada módulo de primeiro nível tem sua própria cor de destaque — ajuda a
// reconhecer a área de longe (mesmo princípio usado em dashboards tipo
// Linear/Stripe). Strings sempre literais (nunca concatenadas em runtime)
// pra o Tailwind conseguir escanear e gerar essas classes.
const CORES_MODULO = {
  laranja: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    hoverBorder: 'hover:border-orange-200',
    groupHoverText: 'group-hover:text-orange-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    hoverBorder: 'hover:border-indigo-200',
    groupHoverText: 'group-hover:text-indigo-500',
  },
  esmeralda: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
    groupHoverText: 'group-hover:text-emerald-500',
  },
} as const

function CardModulo({
  href,
  icon,
  cor,
  titulo,
  descricao,
  disabledTitle,
}: {
  href?: string
  icon: ReactNode
  cor: (typeof CORES_MODULO)[keyof typeof CORES_MODULO]
  titulo: string
  descricao: string
  disabledTitle?: string
}) {
  if (!href) {
    return (
      <div
        aria-disabled="true"
        title={disabledTitle}
        className="flex cursor-not-allowed items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 p-6 opacity-60"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-400">{titulo}</h3>
            <p className="text-sm text-neutral-400">{descricao}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md ${cor.hoverBorder}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cor.bg} ${cor.text}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-900">{titulo}</h3>
          <p className="text-sm text-neutral-500">{descricao}</p>
        </div>
      </div>
      <ChevronRight className={`h-5 w-5 shrink-0 text-neutral-300 transition ${cor.groupHoverText}`} />
    </Link>
  )
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
            <Clock className="h-5 w-5 shrink-0" />
            <span>
              Sua reivindicação está em análise. Esta página fica <strong>oculta ao público</strong> até
              a aprovação (até 5 dias úteis) — aproveite pra completar os dados e o cardápio.
            </span>
          </div>
        )}

        {!emAnalise && !estabelecimento.bairro_id && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <Clock className="h-5 w-5 shrink-0 text-neutral-400" />
            <span>
              Seu estabelecimento já está <strong>ativo</strong> no diretório — o bairro será confirmado pela
              nossa equipe em breve.
            </span>
          </div>
        )}

        <CabecalhoGerenciar
          estabelecimento={estabelecimento}
          usuarioNome={usuarioNome}
          usuarioLogadoId={usuarioLogadoId}
          ehDonoOuGerente={ehDonoOuGerente}
          podeEditar={podeEditar}
          aoVoltar={() => router.push('/painel')}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        {/* Módulos de primeiro nível — agora são destinos de navegação,
            não abas que trocam conteúdo nesta mesma tela. */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardModulo
            href={`/painel/estabelecimento/${id}/gerenciar/cardapio`}
            icon={<UtensilsCrossed className="h-6 w-6" />}
            cor={CORES_MODULO.laranja}
            titulo="Cardápio"
            descricao="Itens, promoções, QR Code e tema"
          />

          {ehDonoOuGerente && (
            <CardModulo
              href={`/painel/estabelecimento/${id}/gerenciar/configuracoes`}
              icon={<Settings className="h-6 w-6" />}
              cor={CORES_MODULO.indigo}
              titulo="Configurações"
              descricao="Horários, galeria, idiomas, equipe e mais"
            />
          )}

          <CardModulo
            href={gestaoAtivado ? `/painel/estabelecimento/${id}/gerenciar/gestao` : undefined}
            icon={<Wrench className="h-6 w-6" />}
            cor={CORES_MODULO.esmeralda}
            titulo="Gestão"
            descricao="Pedidos, estoque, caixa e fornecedores"
            disabledTitle="Módulo de Gestão desativado — ative em Configurações → Módulo de Gestão"
          />
        </div>

        {/* Início do estabelecimento — checklist de progresso do perfil
            público + reserva de espaço pra métricas futuras. */}
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
              <ClipboardCheck className="h-4 w-4 text-orange-500" />
              Complete seu perfil público
            </h2>
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
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-neutral-900">
            <BarChart3 className="h-4 w-4 text-orange-500" />
            Métricas
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Visualizações', Icone: Eye },
              { label: 'Scans de QR Code', Icone: QrCode },
              { label: 'Pedidos', Icone: ShoppingBag },
            ].map(({ label, Icone }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 opacity-60">
                <Icone className="h-5 w-5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-lg font-bold leading-tight text-neutral-400">—</p>
                  <p className="text-xs text-neutral-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
