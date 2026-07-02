'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { CheckCircle, Clock, XCircle, Package, Plus, Eye } from 'lucide-react'

interface Pedido {
  id: string
  mesa: string
  cliente_nome: string
  status: string
  total: number
  criado_em: string
  criado_por: string
}

interface PedidosTabProps {
  estabelecimentoId: string
}

const STATUS_MAP = {
  aberto: { label: 'Aberto', icon: Clock, color: 'text-yellow-400 bg-yellow-900/30' },
  preparando: { label: 'Preparando', icon: Package, color: 'text-blue-400 bg-blue-900/30' },
  pronto: { label: 'Pronto', icon: CheckCircle, color: 'text-green-400 bg-green-900/30' },
  entregue: { label: 'Entregue', icon: CheckCircle, color: 'text-gray-400 bg-gray-700/30' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-red-400 bg-red-900/30' },
}

export default function PedidosTab({ estabelecimentoId }: PedidosTabProps) {
  const supabase = createClient()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<string>('todos')
  const [mostrarModal, setMostrarModal] = useState(false)

  const carregarPedidos = async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('criado_em', { ascending: false })

    if (filtro !== 'todos') {
      query = query.eq('status', filtro)
    }

    const { data, error } = await query

    if (error) {
      logSupabaseError('Erro ao carregar pedidos:', error)
      setError('Erro ao carregar pedidos')
      setLoading(false)
      return
    }

    setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarPedidos()
  }, [estabelecimentoId, filtro])

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', pedidoId)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
      return
    }

    await carregarPedidos()
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-8">Carregando pedidos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-white">📦 Pedidos</h3>
        <div className="flex items-center gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="todos">Todos</option>
            <option value="aberto">Abertos</option>
            <option value="preparando">Preparando</option>
            <option value="pronto">Prontos</option>
            <option value="entregue">Entregues</option>
            <option value="cancelado">Cancelados</option>
          </select>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400">
          <p className="text-lg">Nenhum pedido encontrado.</p>
          <p className="text-sm">Crie um novo pedido para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const statusInfo = STATUS_MAP[pedido.status as keyof typeof STATUS_MAP] || STATUS_MAP.aberto
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={pedido.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {pedido.cliente_nome || 'Cliente'} • Mesa {pedido.mesa || '-'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatarData(pedido.criado_em)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-orange-400">
                      R$ {pedido.total?.toFixed(2) || '0,00'}
                    </span>
                    <div className="flex items-center gap-1">
                      {pedido.status === 'aberto' && (
                        <button
                          onClick={() => atualizarStatus(pedido.id, 'preparando')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition"
                        >
                          ⏳ Preparar
                        </button>
                      )}
                      {pedido.status === 'preparando' && (
                        <button
                          onClick={() => atualizarStatus(pedido.id, 'pronto')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition"
                        >
                          ✅ Pronto
                        </button>
                      )}
                      {pedido.status === 'pronto' && (
                        <button
                          onClick={() => atualizarStatus(pedido.id, 'entregue')}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition"
                        >
                          📤 Entregar
                        </button>
                      )}
                      {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
                        <button
                          onClick={() => atualizarStatus(pedido.id, 'cancelado')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de novo pedido (simplificado) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">🆕 Novo Pedido</h3>
            <p className="text-gray-400 text-sm mb-4">
              Em breve: selecione mesa, cliente e itens do cardápio.
            </p>
            <button
              onClick={() => setMostrarModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}