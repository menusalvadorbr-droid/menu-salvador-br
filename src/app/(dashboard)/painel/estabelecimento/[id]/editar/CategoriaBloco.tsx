'use client'

import { ChevronRight } from 'lucide-react'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'
import ItemRow from './ItemRow'
import BlocoTraducoes from './BlocoTraducoes'
import type { Idioma, TraducoesNome, Categoria, ItemCardapio } from './cardapioTipos'

export default function CategoriaBloco({
  cat,
  catItens,
  expandida,
  readOnly,
  idiomasAtivos,
  refCallback,
  onToggleExpandida,
  catEditandoNome,
  nomeCategoriaEdicao,
  setNomeCategoriaEdicao,
  salvandoNomeCategoria,
  onIniciarEdicaoNomeCategoria,
  onSalvarNomeCategoria,
  onCancelarEdicaoNome,
  catEditandoFoto,
  onToggleFotoCategoria,
  onSalvarFotoCategoria,
  onRemoverFotoCategoria,
  catEditandoTraducoes,
  traducoesCategoria,
  onAbrirTraducoesCategoria,
  onAtualizarTraducaoCategoria,
  onSalvarTraducoesCategoria,
  salvandoTraducoesCategoria,
  onCancelarTraducoes,
  onDeletarCategoria,
  onAdicionarItem,
  onEditarItem,
  onToggleDisponivel,
  onTogglePromo,
  onDeletarItem,
}: {
  cat: Categoria
  catItens: ItemCardapio[]
  expandida: boolean
  readOnly?: boolean
  idiomasAtivos: Idioma[]
  refCallback: (el: HTMLDivElement | null) => void
  onToggleExpandida: () => void
  catEditandoNome: string | null
  nomeCategoriaEdicao: string
  setNomeCategoriaEdicao: (nome: string) => void
  salvandoNomeCategoria: boolean
  onIniciarEdicaoNomeCategoria: (cat: Categoria) => void
  onSalvarNomeCategoria: (id: string) => void
  onCancelarEdicaoNome: () => void
  catEditandoFoto: string | null
  onToggleFotoCategoria: (id: string) => void
  onSalvarFotoCategoria: (id: string, fotoUrl: string) => void
  onRemoverFotoCategoria: (id: string) => void
  catEditandoTraducoes: string | null
  traducoesCategoria: TraducoesNome
  onAbrirTraducoesCategoria: (id: string) => void
  onAtualizarTraducaoCategoria: (idioma: Idioma, valor: string) => void
  onSalvarTraducoesCategoria: (id: string) => void
  salvandoTraducoesCategoria: boolean
  onCancelarTraducoes: () => void
  onDeletarCategoria: (id: string) => void
  onAdicionarItem: (categoriaId: string) => void
  onEditarItem: (item: ItemCardapio) => void
  onToggleDisponivel: (item: ItemCardapio) => void
  onTogglePromo: (item: ItemCardapio) => void
  onDeletarItem: (id: string) => void
}) {
  return (
    <div
      ref={refCallback}
      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm scroll-mt-4"
    >
      {/* cabeçalho */}
      <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        {/* esquerda: nome + ações sobre a categoria em si */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            onClick={onToggleExpandida}
            aria-label={expandida ? 'Recolher categoria' : 'Expandir categoria'}
            aria-expanded={expandida}
            className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${expandida ? 'rotate-90' : ''}`} />
          </button>
          {catEditandoNome === cat.id ? (
            <>
              <input
                value={nomeCategoriaEdicao}
                onChange={(e) => setNomeCategoriaEdicao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSalvarNomeCategoria(cat.id)}
                autoFocus
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
              <button
                onClick={() => onSalvarNomeCategoria(cat.id)}
                disabled={salvandoNomeCategoria || !nomeCategoriaEdicao.trim()}
                className="text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50"
              >
                {salvandoNomeCategoria ? 'salvando…' : 'salvar'}
              </button>
              <button
                onClick={onCancelarEdicaoNome}
                className="text-xs text-gray-500 hover:underline"
              >
                cancelar
              </button>
            </>
          ) : (
            <button
              onClick={onToggleExpandida}
              className="font-semibold text-gray-800 transition hover:text-orange-600"
            >
              {cat.nome}
            </button>
          )}
          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
            {catItens.length} {catItens.length === 1 ? 'item' : 'itens'}
          </span>
          {!readOnly && catEditandoNome !== cat.id && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => onIniciarEdicaoNomeCategoria(cat)}
                className="text-gray-500 hover:underline font-medium"
                title="Renomear categoria"
              >
                ✏️ editar nome
              </button>
              <button
                onClick={() => onToggleFotoCategoria(cat.id)}
                className="text-gray-500 hover:underline font-medium"
                title="Foto da categoria (navegação por cards no cardápio público)"
              >
                🖼️ {cat.foto_url ? 'foto' : 'add. foto'}
              </button>
              {idiomasAtivos.length > 0 && (
                <button
                  onClick={() => onAbrirTraducoesCategoria(cat.id)}
                  className="text-gray-500 hover:underline font-medium"
                >
                  🌐 Traduções
                </button>
              )}
              <button
                onClick={() => onDeletarCategoria(cat.id)}
                className="text-red-400 hover:text-red-600 hover:underline"
              >
                remover categoria
              </button>
            </div>
          )}
        </div>

        {/* direita: ação separada — adicionar algo dentro da categoria */}
        {!readOnly && (
          <button
            onClick={() => onAdicionarItem(cat.id)}
            className="shrink-0 text-orange-600 hover:underline font-medium text-xs"
          >
            + item
          </button>
        )}
      </div>

      {/* painel inline da foto da categoria */}
      {catEditandoFoto === cat.id && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium text-gray-600 mb-2">
            🖼️ Foto da categoria — {cat.nome}
            <span className="ml-1 font-normal text-gray-400">(usada na navegação por cards no cardápio público)</span>
          </p>
          <ImageUpload
            onUpload={(url) => onSalvarFotoCategoria(cat.id, url)}
            onRemove={() => onRemoverFotoCategoria(cat.id)}
            currentImage={cat.foto_url}
            label="Foto da categoria"
            aspectRatio="16:9"
            maxSize={2}
          />
        </div>
      )}

      {/* painel inline de traduções da categoria */}
      {catEditandoTraducoes === cat.id && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium text-gray-600 mb-2">🌐 Traduções — {cat.nome}</p>
          <BlocoTraducoes
            idiomasAtivos={idiomasAtivos}
            campos={['nome']}
            valores={traducoesCategoria}
            onChange={(idi, _campo, valor) => onAtualizarTraducaoCategoria(idi, valor)}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onSalvarTraducoesCategoria(cat.id)}
              disabled={salvandoTraducoesCategoria}
              className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg px-3 py-1.5 disabled:opacity-50"
            >
              {salvandoTraducoesCategoria ? 'Salvando…' : 'Salvar traduções'}
            </button>
            <button
              onClick={onCancelarTraducoes}
              className="text-xs text-gray-500 hover:underline px-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* itens — só renderiza quando a categoria está expandida */}
      {expandida && (
        catItens.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400 text-center">
            Nenhum item — clique em &quot;+ item&quot; para adicionar
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {catItens.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                readOnly={!!readOnly}
                onEditar={() => onEditarItem(item)}
                onToggleDisponivel={() => onToggleDisponivel(item)}
                onTogglePromo={() => onTogglePromo(item)}
                onDeletar={() => onDeletarItem(item.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}
