'use client'

import { useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { LanguageTabs } from './LanguageTabs'
import { TagInput } from './TagInput'

interface ItemCardProps {
  item: any
  layout: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  idiomasAtivos: string[]
  onSave: (dados: any) => void
  onDelete: () => void
  onTogglePromocao: () => void
  onTogglePublicar: () => void
}

function formatarPreco(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '0,00'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export function ItemCard({
  item,
  layout,
  idiomasAtivos,
  onSave,
  onDelete,
  onTogglePromocao,
  onTogglePublicar,
}: ItemCardProps) {
  const [editando, setEditando] = useState(false)
  const [idiomaAtivo, setIdiomaAtivo] = useState('pt')

  // Estados dos campos universais
  const [preco, setPreco] = useState(item.preco)
  const [precoPromocional, setPrecoPromocional] = useState(item.preco_promocional || null)
  const [fotoUrl, setFotoUrl] = useState(item.foto_url || '')
  const [codigo, setCodigo] = useState(item.codigo || '')
  const [promocaoAtiva, setPromocaoAtiva] = useState(item.promocao_ativa)
  const [delivery, setDelivery] = useState(item.delivery_disponivel || false)

  // Estados dos campos traduzíveis
  const [nome, setNome] = useState(item.nome || '')
  const [nomeEn, setNomeEn] = useState(item.nome_en || '')
  const [nomeEs, setNomeEs] = useState(item.nome_es || '')
  const [descricao, setDescricao] = useState(item.descricao || '')
  const [descricaoEn, setDescricaoEn] = useState(item.descricao_en || '')
  const [descricaoEs, setDescricaoEs] = useState(item.descricao_es || '')
  const [tags, setTags] = useState<string[]>(item.tags || [])
  const [tagsEn, setTagsEn] = useState<string[]>(item.tags_en || [])
  const [tagsEs, setTagsEs] = useState<string[]>(item.tags_es || [])

  const promocao = promocaoAtiva && precoPromocional
  const nomeExibicao = codigo ? `${codigo} - ${item.nome}` : item.nome

  const handleSave = () => {
    onSave({
      nome,
      nome_en: nomeEn,
      nome_es: nomeEs,
      preco,
      preco_promocional: precoPromocional,
      descricao,
      descricao_en: descricaoEn,
      descricao_es: descricaoEs,
      tags,
      tags_en: tagsEn,
      tags_es: tagsEs,
      foto_url: fotoUrl,
      promocao_ativa: promocaoAtiva,
      delivery_disponivel: delivery,
      codigo,
    })
    setEditando(false)
  }

  // =================== MODO VISUAL ===================
  if (!editando) {
    if (layout === 'sem-foto') {
      return (
        <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
                {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Promoção</span>}
              </div>
              {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              {promocao ? (
                <>
                  <div className="text-xs text-gray-400 line-through">R$ {formatarPreco(item.preco)}</div>
                  <div className="text-lg font-bold text-green-600">R$ {formatarPreco(item.preco_promocional)}</div>
                </>
              ) : (
                <div className="text-lg font-bold text-gray-900">R$ {formatarPreco(item.preco)}</div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
            <button onClick={() => setEditando(true)} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Editar</button>
            <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
            <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
            <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>{item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}</button>
          </div>
        </div>
      )
    }

    if (layout === 'foto-esquerda') {
      return (
        <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {item.foto_url ? (
                <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
                  {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
                </div>
                <div className="text-right">
                  {promocao ? (
                    <>
                      <div className="text-xs text-gray-400 line-through">R$ {formatarPreco(item.preco)}</div>
                      <div className="text-lg font-bold text-green-600">R$ {formatarPreco(item.preco_promocional)}</div>
                    </>
                  ) : (
                    <div className="text-lg font-bold text-gray-900">R$ {formatarPreco(item.preco)}</div>
                  )}
                </div>
              </div>
              {item.descricao && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.descricao}</p>}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>)}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
            <button onClick={() => setEditando(true)} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Editar</button>
            <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
            <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
            <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>{item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}</button>
          </div>
        </div>
      )
    }

    // foto-topo
    return (
      <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
        {item.foto_url && (
          <div className="w-full h-40 mb-3 rounded-lg overflow-hidden">
            <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
            {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
          </div>
          <div className="text-right">
            {promocao ? (
              <>
                <div className="text-xs text-gray-400 line-through">R$ {formatarPreco(item.preco)}</div>
                <div className="text-lg font-bold text-green-600">R$ {formatarPreco(item.preco_promocional)}</div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-900">R$ {formatarPreco(item.preco)}</div>
            )}
          </div>
        </div>
        {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>)}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
          <button onClick={() => setEditando(true)} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Editar</button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
          <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
          <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>{item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}</button>
        </div>
      </div>
    )
  }

  // =================== MODO EDIÇÃO INLINE ===================
  return (
    <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-lg mb-3">
      {/* Título e botão fechar */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-gray-800">✏️ Editando: {item.nome}</h4>
        <button onClick={() => setEditando(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* ====== CAMPOS UNIVERSAIS (sempre visíveis) ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <label className="text-xs font-medium text-gray-700">Código</label>
          <input type="text" className="w-full border rounded px-2 py-1 text-sm mt-1" value={codigo} onChange={e => setCodigo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Preço *</label>
          <NumericFormat
            value={preco}
            onValueChange={(values) => setPreco(values.floatValue ?? 0)}
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            className="w-full border rounded px-2 py-1 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Preço Promocional</label>
          <NumericFormat
            value={precoPromocional}
            onValueChange={(values) => setPrecoPromocional(values.floatValue ?? null)}
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            className="w-full border rounded px-2 py-1 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Foto</label>
          <ImageUpload onUpload={(url) => setFotoUrl(url)} defaultImage={fotoUrl} tipo="item" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-4 mb-3">
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={promocaoAtiva} onChange={e => setPromocaoAtiva(e.target.checked)} /> Promoção
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)} /> Delivery
        </label>
      </div>

      {/* ====== ABAS DE IDIOMA (campos traduzíveis) ====== */}
      <LanguageTabs active={idiomaAtivo} onChange={setIdiomaAtivo} enabled={idiomasAtivos} />

      {idiomaAtivo === 'pt' && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs font-medium">Nome (PT) *</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium">Descrição (PT)</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Tags (PT)</label>
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>
      )}

      {idiomaAtivo === 'en' && idiomasAtivos.includes('en') && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs font-medium">Nome (EN) 🇺🇸</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={nomeEn} onChange={e => setNomeEn(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Descrição (EN) 🇺🇸</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3} value={descricaoEn} onChange={e => setDescricaoEn(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Tags (EN) 🇺🇸</label>
            <TagInput value={tagsEn} onChange={setTagsEn} />
          </div>
        </div>
      )}

      {idiomaAtivo === 'es' && idiomasAtivos.includes('es') && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs font-medium">Nome (ES) 🇪🇸</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={nomeEs} onChange={e => setNomeEs(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Descrição (ES) 🇪🇸</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3} value={descricaoEs} onChange={e => setDescricaoEs(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Tags (ES) 🇪🇸</label>
            <TagInput value={tagsEs} onChange={setTagsEs} />
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-3 border-t">
        <button onClick={handleSave} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">💾 Salvar</button>
        <button onClick={() => setEditando(false)} className="border px-3 py-1 rounded text-sm">Cancelar</button>
      </div>
    </div>
  )
}