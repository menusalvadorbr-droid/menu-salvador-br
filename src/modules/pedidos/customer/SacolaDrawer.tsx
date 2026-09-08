// src/modules/pedidos/customer/SacolaDrawer.tsx
'use client'

import { useEffect } from 'react'
import type { ItemPedido as ItemSacola } from '../types'
import { useTraducao } from '@/components/public/TraducaoCardapio'
import { BOTAO_PEDIDO_PRIMARIO } from './estilosBotao'

interface SacolaDrawerProps {
  aberto: boolean
  itens: ItemSacola[]
  total: number
  onFechar: () => void
  onRemover: (linhaId: string) => void
  onAlterarQuantidade: (linhaId: string, delta: number) => void
  onFinalizar: () => void
}

export default function SacolaDrawer({
  aberto,
  itens,
  total,
  onFechar,
  onRemover,
  onAlterarQuantidade,
  onFinalizar,
}: SacolaDrawerProps) {
  const { traduzirInterface } = useTraducao()

  useEffect(() => {
    if (!aberto) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [aberto, onFechar])

  if (!aberto) return null

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />

      {/* Modal reduzido */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={traduzirInterface('minha_sacola', 'Minha Sacola')}
        className="relative w-full max-w-md max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
      >
        {/* Cabeçalho com botão de fechar maior */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">🛒 {traduzirInterface('minha_sacola', 'Minha Sacola')}</h2>
          <button
            onClick={onFechar}
            className="text-3xl text-gray-500 hover:text-gray-800 transition-colors p-1 leading-none"
            aria-label={traduzirInterface('fechar', 'Fechar')}
          >
            &times;
          </button>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-4xl" aria-hidden="true">🛍️</span>
              <p className="font-medium text-gray-700">
                {traduzirInterface('sacola_vazia_titulo', 'Sua sacola está vazia')}
              </p>
              <p className="max-w-[220px] text-sm text-gray-500">
                {traduzirInterface('sacola_vazia_texto', 'Que tal dar uma olhada no cardápio e escolher algo gostoso?')}
              </p>
              <button
                onClick={onFechar}
                className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                {traduzirInterface('ver_cardapio', 'Ver cardápio')}
              </button>
            </div>
          ) : (
            itens.map((item) => {
              const preco = item.preco_promocional && item.preco_promocional < item.preco
                ? item.preco_promocional
                : item.preco
              const linhaId = item.linhaId || item.id
              const detalhes = [
                item.variacao?.nome,
                ...(item.complementos || []).map((c) => c.opcaoNome),
              ].filter(Boolean)
              return (
                <div key={linhaId} className="flex justify-between items-center border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.nome}</p>
                    {detalhes.length > 0 && (
                      <p className="text-xs text-gray-400">{detalhes.join(' · ')}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      R$ {formatarPreco(preco)} x {item.quantidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* w-11 h-11 (44px) — mínimo recomendado de zona de toque;
                        os botões antigos (28px) geravam clique acidental
                        fácil numa lista rolável no celular. */}
                    <button
                      onClick={() => onAlterarQuantidade(linhaId, -1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
                      aria-label={traduzirInterface('diminuir_quantidade', 'Diminuir quantidade')}
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => onAlterarQuantidade(linhaId, 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
                      aria-label={traduzirInterface('aumentar_quantidade', 'Aumentar quantidade')}
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemover(linhaId)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-red-500 transition hover:bg-red-50 hover:text-red-700"
                      aria-label={traduzirInterface('remover_item', 'Remover item')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé com total e botão finalizar */}
        <div className="border-t p-4">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>{traduzirInterface('total_label', 'Total')}</span>
            <span>R$ {formatarPreco(total)}</span>
          </div>
          <button onClick={onFinalizar} disabled={itens.length === 0} className={`w-full ${BOTAO_PEDIDO_PRIMARIO}`}>
            📦 {traduzirInterface('finalizar_pedido', 'Finalizar Pedido')}
          </button>
        </div>
      </div>
    </div>
  )
}