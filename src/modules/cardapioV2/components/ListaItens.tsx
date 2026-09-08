'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import { formatarReais } from '@/lib/moeda'
import { getCloudflareImageUrl } from '@/lib/cloudflareImage'
import { alternarAtivoItem, excluirItem, listarItensCompletos, reordenarItens } from '../itemRepository'
import { podeUsar } from '../permissoes'
import type { CardapioV2Cardapio, CardapioV2ItemCompleto } from '../types'
import ItemForm from './ItemForm'

export default function ListaItens({
  estabelecimento,
  categoriaId,
  cardapio,
}: {
  estabelecimento: { id: string }
  categoriaId: string | null
  cardapio: CardapioV2Cardapio | null
}) {
  const [itens, setItens] = useState<CardapioV2ItemCompleto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [itemEmEdicao, setItemEmEdicao] = useState<CardapioV2ItemCompleto | 'novo' | null>(null)
  const [itemParaExcluir, setItemParaExcluir] = useState<CardapioV2ItemCompleto | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const recarregar = useCallback(async () => {
    if (!categoriaId) {
      setItens([])
      return
    }
    setCarregando(true)
    setItens(await listarItensCompletos([categoriaId]))
    setCarregando(false)
  }, [categoriaId])

  useEffect(() => {
    // Busca pontual ao trocar de categoria (não uma inscrição em algo que
    // muda sozinho).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar()
  }, [recarregar])

  async function handleMover(index: number, direcao: -1 | 1) {
    const alvo = itens[index + direcao]
    const atual = itens[index]
    if (!alvo) return
    await reordenarItens({ id: atual.id, ordem: atual.ordem }, { id: alvo.id, ordem: alvo.ordem })
    recarregar()
  }

  async function handleExcluir(id: string) {
    setExcluindo(true)
    await excluirItem(id)
    setExcluindo(false)
    setItemParaExcluir(null)
    recarregar()
  }

  if (!categoriaId) return <p className="text-sm text-neutral-400">Selecione ou crie uma categoria.</p>
  if (carregando) return <p className="text-sm text-neutral-400">Carregando itens…</p>

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => podeUsar(estabelecimento, 'cardapio_v2.itens.criar') && setItemEmEdicao('novo')}
          className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Novo item
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {itens.length === 0 && <p className="text-sm text-neutral-400">Nenhum item nesta categoria ainda.</p>}
        {itens.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5">
            {item.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getCloudflareImageUrl(item.foto_url, { width: 40, height: 40 })!}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-100" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${item.ativo ? 'text-neutral-800' : 'text-neutral-400 line-through'}`}>{item.nome}</p>
              <p className="text-xs text-neutral-400">R$ {formatarReais(item.preco_base)}{item.variacoes.length > 0 && ` + ${item.variacoes.length} variação(ões)`}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-neutral-400">
              <button title="Subir" disabled={index === 0} onClick={() => handleMover(index, -1)} className="disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button title="Descer" disabled={index === itens.length - 1} onClick={() => handleMover(index, 1)} className="disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                title={item.ativo ? 'Desativar' : 'Ativar'}
                onClick={() => alternarAtivoItem(item.id, !item.ativo).then(recarregar)}
                className="text-xs font-medium underline"
              >
                {item.ativo ? 'desativar' : 'ativar'}
              </button>
              <button title="Editar" onClick={() => setItemEmEdicao(item)} className="hover:text-neutral-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button title="Excluir" onClick={() => setItemParaExcluir(item)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {itemEmEdicao && cardapio && (
        <ItemForm
          estabelecimento={estabelecimento}
          categoriaId={categoriaId}
          itemExistente={itemEmEdicao === 'novo' ? null : itemEmEdicao}
          recursos={cardapio}
          onClose={() => setItemEmEdicao(null)}
          onSalvo={recarregar}
        />
      )}

      {itemParaExcluir && (
        <ConfirmarAcaoModal
          titulo="Excluir item?"
          descricao={`Excluir "${itemParaExcluir.nome}"?`}
          confirmarLabel="Excluir"
          tom="perigo"
          enviando={excluindo}
          onCancelar={() => setItemParaExcluir(null)}
          onConfirmar={() => handleExcluir(itemParaExcluir.id)}
        />
      )}
    </div>
  )
}
