'use client'

import { useEffect, useState } from 'react'
import { useSacola } from '../customer/useSacola'
import { criarPedido } from '../ordersRepository'
import { listarCardapioParaGarcom, type CategoriaComItens } from './cardapioParaGarcom'
import type { Mesa } from '../mesas/types'
import type { TipoPedido } from '../types'

/**
 * Tela da equipe pra lançar um pedido — usada tanto a partir de uma mesa
 * (mapa de mesas) quanto pra venda direta no balcão (mesa=null). O fluxo
 * e a UI são os mesmos; só muda o título e o que é gravado no pedido.
 */
export default function LancarPedidoGarcom({
  estabelecimentoId,
  mesa,
  onFechar,
  onPedidoLancado,
}: {
  estabelecimentoId: string
  mesa: Mesa | null
  onFechar: () => void
  onPedidoLancado: () => void
}) {
  const [categorias, setCategorias] = useState<CategoriaComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [modoContingencia, setModoContingencia] = useState(false)
  const sacola = useSacola()

  const tipoPedido: TipoPedido = mesa ? 'mesa' : 'balcao'
  const titulo = mesa ? `Mesa ${mesa.numero}` : 'Venda no balcão'

  useEffect(() => {
    listarCardapioParaGarcom(estabelecimentoId)
      .then(setCategorias)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  async function lancarPedido() {
    if (sacola.itens.length === 0) return
    setEnviando(true)

    const resposta = await criarPedido({
      estabelecimento_id: estabelecimentoId,
      items: sacola.itens,
      total: sacola.total,
      tipo_pedido: tipoPedido,
      mesa: mesa?.numero,
      mesa_id: mesa?.id,
      origem: 'garcom',
    })

    setEnviando(false)

    if (resposta.modo === 'contingencia') {
      // Sem WhatsApp aqui — o garçom já está dentro do sistema, só avisamos
      // que ficou salvo localmente e será sincronizado sozinho.
      setModoContingencia(true)
      setTimeout(() => {
        sacola.limparSacola()
        onPedidoLancado()
      }, 1800)
    } else {
      sacola.limparSacola()
      onPedidoLancado()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <h2 className="text-lg font-bold text-neutral-900">{titulo}</h2>
          <button onClick={onFechar} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        {modoContingencia ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="text-3xl">💾</span>
            <p className="text-sm font-medium text-neutral-700">
              Sem conexão no momento — pedido salvo localmente e será sincronizado automaticamente.
            </p>
          </div>
        ) : carregando ? (
          <div className="flex flex-1 items-center justify-center p-8 text-neutral-400">Carregando cardápio...</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {categorias.map((cat) => (
                <div key={cat.id} className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {cat.nome}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {cat.itens.map((item) => {
                      const preco = item.preco_promocional ?? item.preco
                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            sacola.adicionarItem({ id: item.id, nome: item.nome, preco: item.preco, preco_promocional: item.preco_promocional || undefined })
                          }
                          className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-left text-sm hover:border-orange-200 hover:bg-orange-50"
                        >
                          <span className="text-neutral-800">{item.nome}</span>
                          <span className="font-semibold text-neutral-900">R$ {preco.toFixed(2)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {categorias.length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-400">Cardápio vazio.</p>
              )}
            </div>

            {sacola.itens.length > 0 && (
              <div className="border-t border-neutral-100 p-4">
                <div className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm">
                  {sacola.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-neutral-700">
                        {item.quantidade}x {item.nome}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sacola.alterarQuantidade(item.id, item.quantidade - 1)}
                          className="h-6 w-6 rounded-full border border-neutral-200 text-neutral-500"
                        >
                          −
                        </button>
                        <button
                          onClick={() => sacola.alterarQuantidade(item.id, item.quantidade + 1)}
                          className="h-6 w-6 rounded-full border border-neutral-200 text-neutral-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mb-3 flex justify-between text-base font-bold text-neutral-900">
                  <span>Total</span>
                  <span>R$ {sacola.total.toFixed(2)}</span>
                </div>
                <button
                  onClick={lancarPedido}
                  disabled={enviando}
                  className="w-full rounded-lg bg-orange-600 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {enviando ? 'Lançando...' : mesa ? `Lançar pedido — Mesa ${mesa.numero}` : 'Lançar venda no balcão'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
