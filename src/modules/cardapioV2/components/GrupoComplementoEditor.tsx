'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatarReais } from '@/lib/moeda'
import {
  criarGrupoComplemento,
  criarOpcaoComplemento,
  excluirGrupoComplemento,
  excluirOpcaoComplemento,
  listarGruposComplemento,
  type GrupoComplementoComOpcoes,
} from '../grupoComplementoRepository'

/** Grupos são do estabelecimento (não da categoria/item) — reutilizáveis
 * entre itens, ver cardapio-v2-visao.md. Gerenciados aqui de forma
 * independente; o vínculo item↔grupo acontece no ItemForm. */
export default function GrupoComplementoEditor({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [grupos, setGrupos] = useState<GrupoComplementoComOpcoes[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novoMinimo, setNovoMinimo] = useState(0)
  const [novoMaximo, setNovoMaximo] = useState(1)

  async function recarregar() {
    setGrupos(await listarGruposComplemento(estabelecimentoId))
  }

  useEffect(() => {
    // Busca pontual ao montar (não uma inscrição em algo que muda sozinho).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId])

  async function handleCriarGrupo() {
    if (!novoNome.trim()) return
    await criarGrupoComplemento(estabelecimentoId, { nome: novoNome.trim(), minimo: novoMinimo, maximo: novoMaximo })
    setNovoNome('')
    setNovoMinimo(0)
    setNovoMaximo(1)
    await recarregar()
  }

  async function handleAdicionarOpcao(grupoId: string) {
    const nome = prompt('Nome da opção (ex: Bacon extra)')
    if (!nome?.trim()) return
    const precoTexto = prompt('Preço adicional (ex: 5.00)', '0')
    await criarOpcaoComplemento(grupoId, { nome: nome.trim(), preco_adicional: Number(precoTexto) || 0 })
    await recarregar()
  }

  if (carregando) return <p className="text-sm text-neutral-400">Carregando…</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 p-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-600">Nome do grupo</label>
          <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Escolha o molho" className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Mínimo</label>
          <input type="number" value={novoMinimo} onChange={(e) => setNovoMinimo(Number(e.target.value))} className="w-20 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Máximo</label>
          <input type="number" value={novoMaximo} onChange={(e) => setNovoMaximo(Number(e.target.value))} className="w-20 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm" />
        </div>
        <button onClick={handleCriarGrupo} className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white">
          <Plus className="h-3.5 w-3.5" /> Criar grupo
        </button>
      </div>

      {grupos.map((grupo) => (
        <div key={grupo.id} className="rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800">
              {grupo.nome} <span className="font-normal text-neutral-400">(min {grupo.minimo}, máx {grupo.maximo})</span>
            </h4>
            <button onClick={() => excluirGrupoComplemento(grupo.id).then(recarregar)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {grupo.opcoes.map((opcao) => (
              <li key={opcao.id} className="flex items-center justify-between text-sm text-neutral-600">
                <span>{opcao.nome} {opcao.preco_adicional > 0 && `(+R$ ${formatarReais(opcao.preco_adicional)})`}</span>
                <button onClick={() => excluirOpcaoComplemento(opcao.id).then(recarregar)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => handleAdicionarOpcao(grupo.id)} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-600">
            <Plus className="h-3.5 w-3.5" /> Adicionar opção
          </button>
        </div>
      ))}
    </div>
  )
}
