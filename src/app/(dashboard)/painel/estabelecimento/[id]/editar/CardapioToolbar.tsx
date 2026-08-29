'use client'

import { useState } from 'react'
import { Download, Upload, Globe, Plus } from 'lucide-react'

interface CategoriaSimples {
  id: string
  nome: string
}

/**
 * Barra de controles acima da lista de categorias — planilha, criar
 * categoria, criar item, e o atalho "ir para categoria" fixo no topo ao
 * rolar. Extraído de CardapioTab.tsx: diferente da maioria dos outros
 * extracts deste arquivo, aqui dá pra localizar de verdade o estado do
 * mini-formulário "nova categoria"/"selecionar categoria pro novo item"
 * dentro do próprio componente — nenhum outro lugar do CardapioTab lê
 * esse estado, só as duas ações finais (criar categoria, abrir modal de
 * item), que já eram funções parametrizáveis.
 */
export default function CardapioToolbar({
  readOnly,
  loading,
  menuId,
  categorias,
  idiomasAtivos,
  carregandoPlanilhaTraducao,
  itensPorCategoria,
  onBaixarPlanilha,
  onAbrirModalPlanilha,
  onBaixarPlanilhaTraducao,
  onAbrirModalPlanilhaTraducao,
  onCriarCategoria,
  onAdicionarItem,
  onIrParaCategoria,
  onExpandirTodas,
  onRecolherTodas,
}: {
  readOnly?: boolean
  loading: boolean
  menuId: string | null
  categorias: CategoriaSimples[]
  idiomasAtivos: unknown[]
  carregandoPlanilhaTraducao: boolean
  itensPorCategoria: (categoriaId: string) => number
  onBaixarPlanilha: () => void
  onAbrirModalPlanilha: () => void
  onBaixarPlanilhaTraducao: () => void
  onAbrirModalPlanilhaTraducao: () => void
  onCriarCategoria: (nome: string) => Promise<{ ok: boolean; erro?: string }>
  onAdicionarItem: (categoriaId: string) => void
  onIrParaCategoria: (categoriaId: string) => void
  onExpandirTodas: () => void
  onRecolherTodas: () => void
}) {
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [erroCategoria, setErroCategoria] = useState<string | null>(null)

  const [mostrarSeletorItemCategoria, setMostrarSeletorItemCategoria] = useState(false)
  const [categoriaParaNovoItem, setCategoriaParaNovoItem] = useState('')

  async function submeterNovaCategoria() {
    const nome = novaCategoria.trim()
    if (!nome) return
    setCriandoCategoria(true)
    setErroCategoria(null)
    const resultado = await onCriarCategoria(nome)
    if (resultado.ok) {
      setNovaCategoria('')
      setMostrarFormCategoria(false)
    } else {
      setErroCategoria(resultado.erro || 'Erro ao criar categoria.')
    }
    setCriandoCategoria(false)
  }

  return (
    <>
      {!readOnly && (
        <div className="space-y-3">
          {/* Planilha (cardápio + tradução) */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBaixarPlanilha}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap"
            >
              <Download className="h-4 w-4" /> Baixar planilha
            </button>
            <button
              onClick={onAbrirModalPlanilha}
              disabled={!menuId}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
            >
              <Upload className="h-4 w-4" /> Subir planilha
            </button>

            {/* Planilha de tradução — só faz sentido com pelo menos um
                idioma ativado em Configurações → Idiomas. */}
            {idiomasAtivos.length > 0 && (
              <>
                <button
                  onClick={onBaixarPlanilhaTraducao}
                  disabled={carregandoPlanilhaTraducao}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
                >
                  <Globe className="h-4 w-4" /> Baixar traduções
                </button>
                <button
                  onClick={onAbrirModalPlanilhaTraducao}
                  disabled={!menuId || carregandoPlanilhaTraducao}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
                >
                  <Globe className="h-4 w-4" /> Subir traduções
                </button>
              </>
            )}
          </div>

          {/* Categoria (esquerda) e item (direita) na mesma linha — só
              quebram pra linha de baixo se a tela não comportar as duas. */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Nova categoria — botão revela o campo de nome */}
            {!mostrarFormCategoria ? (
              <button
                onClick={() => setMostrarFormCategoria(true)}
                disabled={!menuId}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition"
              >
                <Plus className="h-4 w-4" /> Adicionar categoria
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submeterNovaCategoria() }}
                    placeholder="Nome da categoria…"
                    autoFocus
                    disabled={!menuId || criandoCategoria}
                    className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 bg-white text-gray-900"
                  />
                  <button
                    onClick={submeterNovaCategoria}
                    disabled={criandoCategoria || !novaCategoria.trim() || !menuId}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition whitespace-nowrap"
                  >
                    {criandoCategoria ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => { setMostrarFormCategoria(false); setNovaCategoria(''); setErroCategoria(null) }}
                    className="text-sm text-gray-500 hover:underline px-1"
                  >
                    Cancelar
                  </button>
                </div>
                {erroCategoria && (
                  <p className="text-xs text-red-500">{erroCategoria}</p>
                )}
                {!menuId && !loading && (
                  <p className="text-xs text-yellow-600">⚠️ Menu não localizado — recarregue a página</p>
                )}
              </div>
            )}

            {/* Novo item — primeiro escolhe a categoria, só depois abre o
                formulário completo com os dados do item */}
            {!mostrarSeletorItemCategoria ? (
              <button
                onClick={() => {
                  setCategoriaParaNovoItem(categorias[0]?.id || '')
                  setMostrarSeletorItemCategoria(true)
                }}
                disabled={categorias.length === 0}
                title={categorias.length === 0 ? 'Crie uma categoria primeiro' : ''}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition"
              >
                <Plus className="h-4 w-4" /> Adicionar item
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={categoriaParaNovoItem}
                  onChange={(e) => setCategoriaParaNovoItem(e.target.value)}
                  autoFocus
                  className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setMostrarSeletorItemCategoria(false)
                    onAdicionarItem(categoriaParaNovoItem)
                  }}
                  disabled={!categoriaParaNovoItem}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition whitespace-nowrap"
                >
                  Continuar
                </button>
                <button
                  onClick={() => setMostrarSeletorItemCategoria(false)}
                  className="text-sm text-gray-500 hover:underline px-1"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ATALHO DE CATEGORIA — fica fixo e visível no topo ao rolar o
          cardápio, pra achar rápido numa lista grande sem perder a
          referência de onde se está. */}
      {categorias.length > 1 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white/95 py-2 backdrop-blur">
          <select
            value=""
            onChange={(e) => { if (e.target.value) onIrParaCategoria(e.target.value) }}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
          >
            <option value="">Ir para categoria…</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome} ({itensPorCategoria(cat.id)})
              </option>
            ))}
          </select>
          <button
            onClick={onExpandirTodas}
            className="text-xs font-medium text-gray-500 hover:text-orange-600 hover:underline whitespace-nowrap"
          >
            Expandir todas
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={onRecolherTodas}
            className="text-xs font-medium text-gray-500 hover:text-orange-600 hover:underline whitespace-nowrap"
          >
            Recolher todas
          </button>
        </div>
      )}
    </>
  )
}
