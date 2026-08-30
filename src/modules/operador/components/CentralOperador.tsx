'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, MessageCircleQuestion, QrCode, Truck, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTodasConversas } from '../hooks/useTodasConversas'
import { useFilaPix } from '../hooks/useFilaPix'
import { useFilaValidacao } from '../hooks/useFilaValidacao'
import { formatarTelefoneExibicao } from '@/lib/telefone'
import { haQuantoTempo, minutosDesde, tierEspera, CORES_TIER } from '../tempoEspera'
import PainelConversa from './PainelConversa'
import PainelPedidoPix from './PainelPedidoPix'
import PainelValidacaoEntrega from './PainelValidacaoEntrega'
import type { ConversaFilaIA, ValidacaoPedido } from '../types'
import type { Pedido } from '../../pedidos/types'

type Tipo = 'ia' | 'pix' | 'validacao' | 'resolvida'
type FiltroTipo = 'tudo' | Tipo

type ItemFila =
  | { tipo: 'ia'; id: string; esperando: string; textoBusca: string; dados: ConversaFilaIA }
  | { tipo: 'resolvida'; id: string; esperando: string; textoBusca: string; dados: ConversaFilaIA }
  | { tipo: 'pix'; id: string; esperando: string; textoBusca: string; dados: Pedido }
  | { tipo: 'validacao'; id: string; esperando: string; textoBusca: string; dados: ValidacaoPedido }

// Vocabulário único de filtro — antes "Fila do Operador" usava um
// conjunto (Tudo/IA precisa de você/Pix aguardando/Validar entrega) e
// "Conversas" usava outro (Todas/Precisam de você/Só a IA) pra falar da
// mesma coisa. Strings sempre literais pra o Tailwind escanear.
const FILTROS: { tipo: FiltroTipo; label: string; ativo: string; inativo: string }[] = [
  { tipo: 'tudo', label: 'Tudo', ativo: 'bg-neutral-900 text-white', inativo: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' },
  { tipo: 'ia', label: 'IA precisa de você', ativo: 'bg-amber-600 text-white', inativo: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  { tipo: 'pix', label: 'Pix aguardando', ativo: 'bg-sky-600 text-white', inativo: 'bg-sky-100 text-sky-800 hover:bg-sky-200' },
  { tipo: 'validacao', label: 'Validar entrega', ativo: 'bg-neutral-700 text-white', inativo: 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300' },
  { tipo: 'resolvida', label: 'Resolvidas', ativo: 'bg-neutral-500 text-white', inativo: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' },
]

function tituloItem(item: ItemFila): string {
  if (item.tipo === 'ia' || item.tipo === 'resolvida') return formatarTelefoneExibicao(item.dados.telefone)
  if (item.tipo === 'pix') return item.dados.nome_cliente || 'Cliente'
  return item.dados.pedido.nome_cliente || 'Cliente'
}

function previewItem(item: ItemFila): string {
  if (item.tipo === 'ia' || item.tipo === 'resolvida') {
    const ultima = item.dados.mensagens[item.dados.mensagens.length - 1]
    return ultima?.content || 'Sem mensagens ainda.'
  }
  if (item.tipo === 'pix') return `Pedido ${item.dados.codigo_pedido} · R$ ${item.dados.total.toFixed(2)}`
  return `Pedido ${item.dados.pedido.codigo_pedido} · R$ ${item.dados.pedido.total.toFixed(2)}`
}

/** Central do Operador — tela única que substitui o que antes ficava
 *  dividido entre "Fila do Operador" (/operador) e "Conversas"
 *  (/conversas): uma lista mestre só (pendências de IA/Pix/Validação
 *  primeiro, ordenadas por tempo de espera, seguidas do histórico de
 *  conversas resolvidas) e um painel de detalhe à direita que muda de
 *  conteúdo conforme o tipo do item selecionado, sem trocar de tela nem
 *  de sistema visual. A mesma conversa aparecia em até 3 componentes
 *  visuais diferentes (FilaOperador, ConversasInbox, FaixaPendencias no
 *  board de Pedidos), com rótulos de ação divergentes pra mesma função
 *  de backend.
 *
 *  "Atribuir a mim" (ver PainelConversa) ainda é só local a esta aba do
 *  navegador — não existe coluna de "atendido por" em whatsapp_conversas
 *  hoje. Pra valer entre operadores/dispositivos precisa de uma migration
 *  (ex: whatsapp_conversas.atendido_por uuid) + persistir aqui; por ora é
 *  só a afirmação visual de posse dentro da sessão de quem clicou. */
export default function CentralOperador({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { conversas, carregando: carregandoConversas } = useTodasConversas(estabelecimentoId)
  const { pedidos: pixPendentes, carregando: carregandoPix } = useFilaPix(estabelecimentoId)
  const { validacoes, carregando: carregandoValidacao, recarregar: recarregarValidacoes } = useFilaValidacao(estabelecimentoId)

  const [filtro, setFiltro] = useState<FiltroTipo>('tudo')
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [atribuidos, setAtribuidos] = useState<Record<string, string>>({})
  const [nomeOperador, setNomeOperador] = useState('Você')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const nome = user?.user_metadata?.full_name || user?.email || null
      if (nome) setNomeOperador(nome.split(' ')[0])
    })
  }, [])

  const carregando = carregandoConversas || carregandoPix || carregandoValidacao

  const pendencias: ItemFila[] = useMemo(() => {
    const itens: ItemFila[] = [
      ...conversas
        .filter((c) => c.precisa_humano)
        .map((c): ItemFila => ({
          tipo: 'ia',
          id: `ia-${c.id}`,
          esperando: c.ultima_interacao_em,
          textoBusca: c.telefone.toLowerCase(),
          dados: c,
        })),
      ...pixPendentes.map((p): ItemFila => ({
        tipo: 'pix',
        id: `pix-${p.id}`,
        esperando: p.created_at,
        textoBusca: `${p.codigo_pedido} ${p.nome_cliente || ''}`.toLowerCase(),
        dados: p,
      })),
      ...validacoes.map((v): ItemFila => ({
        tipo: 'validacao',
        id: `validacao-${v.id}`,
        esperando: v.created_at,
        textoBusca: `${v.pedido.codigo_pedido} ${v.pedido.nome_cliente || ''}`.toLowerCase(),
        dados: v,
      })),
    ]
    // Mais antigo esperando primeiro — é quem está há mais tempo sem
    // resposta que precisa da atenção do operador agora.
    return itens.sort((a, b) => new Date(a.esperando).getTime() - new Date(b.esperando).getTime())
  }, [conversas, pixPendentes, validacoes])

  const resolvidas: ItemFila[] = useMemo(() => {
    return conversas
      .filter((c) => !c.precisa_humano)
      .map((c): ItemFila => ({
        tipo: 'resolvida',
        id: `resolvida-${c.id}`,
        esperando: c.ultima_interacao_em,
        textoBusca: c.telefone.toLowerCase(),
        dados: c,
      }))
      // Aqui já não é "espera" — é histórico, ordena como um inbox normal
      // (interação mais recente primeiro).
      .sort((a, b) => new Date(b.esperando).getTime() - new Date(a.esperando).getTime())
  }, [conversas])

  const contagem: Record<FiltroTipo, number> = {
    tudo: pendencias.length + resolvidas.length,
    ia: pendencias.filter((i) => i.tipo === 'ia').length,
    pix: pendencias.filter((i) => i.tipo === 'pix').length,
    validacao: pendencias.filter((i) => i.tipo === 'validacao').length,
    resolvida: resolvidas.length,
  }

  const todosOsItens = [...pendencias, ...resolvidas]
  const termoBusca = busca.trim().toLowerCase()
  const itensFiltrados = todosOsItens
    .filter((i) => filtro === 'tudo' || i.tipo === filtro)
    .filter((i) => !termoBusca || i.textoBusca.includes(termoBusca))

  const selecionado = itensFiltrados.find((i) => i.id === selecionadoId) || itensFiltrados[0]

  function atribuirAMim(conversaId: string) {
    setAtribuidos((atual) => ({ ...atual, [conversaId]: nomeOperador }))
  }

  if (carregando) {
    return (
      <div className="flex h-[660px] gap-4">
        <div className="h-full w-[360px] shrink-0 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-full flex-1 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.tipo}
            onClick={() => setFiltro(f.tipo)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${filtro === f.tipo ? f.ativo : f.inativo}`}
          >
            {f.label} <span className="opacity-70">{contagem[f.tipo]}</span>
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código ou telefone"
            className="w-64 rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>
      </div>

      <div className="flex h-[660px] gap-4">
        {/* Lista — esquerda */}
        <div className="flex w-[360px] shrink-0 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-neutral-100 p-2.5">
          {itensFiltrados.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-neutral-500">
              {termoBusca ? 'Nenhum item encontrado com esse termo.' : 'Nenhum item por aqui agora.'}
            </p>
          ) : (
            itensFiltrados.map((item) => {
              const ativo = selecionado?.id === item.id
              const minutos = minutosDesde(item.esperando)
              const tier = item.tipo === 'resolvida' ? 'baixa' : tierEspera(minutos)
              const cores = CORES_TIER[tier]
              return (
                <button
                  key={item.id}
                  onClick={() => setSelecionadoId(item.id)}
                  className={`flex items-start gap-2.5 rounded-xl p-3 text-left transition ${
                    ativo ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      item.tipo === 'ia'
                        ? 'bg-amber-200 text-amber-800'
                        : item.tipo === 'pix'
                          ? 'bg-sky-200 text-sky-800'
                          : item.tipo === 'validacao'
                            ? 'bg-neutral-300 text-neutral-700'
                            : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {item.tipo === 'ia' && <MessageCircleQuestion className="h-4 w-4" strokeWidth={2.5} />}
                    {item.tipo === 'pix' && <QrCode className="h-4 w-4" strokeWidth={2.5} />}
                    {item.tipo === 'validacao' && <Truck className="h-4 w-4" strokeWidth={2.5} />}
                    {item.tipo === 'resolvida' && <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-bold text-neutral-900">{tituloItem(item)}</span>
                      <span className={`shrink-0 whitespace-nowrap text-[10.5px] font-extrabold ${cores.texto}`}>
                        {haQuantoTempo(item.esperando)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-600">{previewItem(item)}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Detalhe — direita */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-neutral-100 bg-white">
          {!selecionado ? (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
              Nenhum item nesse filtro.
            </div>
          ) : selecionado.tipo === 'ia' || selecionado.tipo === 'resolvida' ? (
            <PainelConversa
              key={selecionado.id}
              estabelecimentoId={estabelecimentoId}
              conversa={selecionado.dados}
              atribuidoPara={atribuidos[selecionado.dados.id] || null}
              aoAtribuirAMim={() => atribuirAMim(selecionado.dados.id)}
            />
          ) : selecionado.tipo === 'pix' ? (
            <PainelPedidoPix key={selecionado.id} estabelecimentoId={estabelecimentoId} pedido={selecionado.dados} />
          ) : (
            <PainelValidacaoEntrega
              key={selecionado.id}
              estabelecimentoId={estabelecimentoId}
              validacao={selecionado.dados}
              onPedidoEditado={recarregarValidacoes}
            />
          )}
        </div>
      </div>
    </div>
  )
}
