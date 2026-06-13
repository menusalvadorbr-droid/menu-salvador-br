// src/app/painel/components/cardapio/ItemEditForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { ImageUpload } from '@/components/upload/ImageUpload'

const IDIOMA_PADRAO = 'pt'

interface ItemEditFormProps {
  item: any
  onSave: (dados: any) => void
  onCancel: () => void
  idiomasAtivos: string[]
}

export function ItemEditForm({ item, onSave, onCancel, idiomasAtivos }: ItemEditFormProps) {
  // Campos principais
  const [codigo, setCodigo] = useState(item.codigo || '')
  const [nome, setNome] = useState(item.nome || '')
  const [descricao, setDescricao] = useState(item.descricao || '')
  const [preco, setPreco] = useState(item.preco?.toString() || '')
  const [precoPromocional, setPrecoPromocional] = useState(item.preco_promocional?.toString() || '')
  const [fotoUrl, setFotoUrl] = useState(item.foto_url || '')
  const [tagsInput, setTagsInput] = useState(item.tags?.join(', ') || '')
  const [delivery, setDelivery] = useState(item.delivery_disponivel || false)

  // Idiomas que terão campos de tradução (todos exceto o padrão)
  const idiomasTraduziveis = idiomasAtivos.filter((idioma) => idioma !== IDIOMA_PADRAO)

  // Inicializa traduções apenas para os outros idiomas
  const carregarTraducoes = () => {
    const resultado: Record<string, { nome: string; descricao: string }> = {}
    idiomasTraduziveis.forEach((idioma) => {
      resultado[idioma] = {
        nome: item[`nome_${idioma}`] || '',
        descricao: item[`descricao_${idioma}`] || '',
      }
    })
    return resultado
  }

  const [traducoes, setTraducoes] = useState(carregarTraducoes)

  // Recarrega se o item mudar
  useEffect(() => {
    setCodigo(item.codigo || '')
    setNome(item.nome || '')
    setDescricao(item.descricao || '')
    setPreco(item.preco?.toString() || '')
    setPrecoPromocional(item.preco_promocional?.toString() || '')
    setFotoUrl(item.foto_url || '')
    setTagsInput(item.tags?.join(', ') || '')
    setDelivery(item.delivery_disponivel || false)
    setTraducoes(carregarTraducoes())
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const dados: any = {
      codigo: codigo.trim() || null,
      nome,
      descricao,
      preco: parseFloat(preco),
      preco_promocional: precoPromocional ? parseFloat(precoPromocional) : null,
      foto_url: fotoUrl || null,
      tags: tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean),
      delivery_disponivel: delivery,
    }

    // Adiciona apenas as traduções para os outros idiomas
    idiomasTraduziveis.forEach((idioma) => {
      const trad = traducoes[idioma]
      if (trad) {
        dados[`nome_${idioma}`] = trad.nome || ''
        dados[`descricao_${idioma}`] = trad.descricao || ''
      }
    })

    onSave(dados)
  }

  const atualizarTraducao = (idioma: string, campo: string, valor: string) => {
    setTraducoes((prev) => ({
      ...prev,
      [idioma]: {
        ...prev[idioma],
        [campo]: valor,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-4">
      {/* Campos principais (Português) */}
      <div>
        <h4 className="font-medium text-sm mb-2">Informações principais (Português)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Código (opcional)</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full border rounded px-3 py-1"
              placeholder="Ex: BEB-001"
            />
          </div>
          <div>
            <label className="block text-sm">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded px-3 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border rounded px-3 py-1"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full border rounded px-3 py-1"
              placeholder="Ex: vegano, apimentado"
            />
          </div>
        </div>
      </div>

      {/* Traduções (outros idiomas) */}
      {idiomasTraduziveis.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Traduções</h4>
          {idiomasTraduziveis.map((idioma) => (
            <div key={idioma} className="border p-3 rounded mb-2">
              <span className="text-xs font-bold uppercase bg-gray-200 px-2 py-0.5 rounded">
                {idioma}
              </span>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs">Nome ({idioma})</label>
                  <input
                    type="text"
                    value={traducoes[idioma]?.nome || ''}
                    onChange={(e) => atualizarTraducao(idioma, 'nome', e.target.value)}
                    className="w-full border rounded px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs">Descrição ({idioma})</label>
                  <textarea
                    value={traducoes[idioma]?.descricao || ''}
                    onChange={(e) => atualizarTraducao(idioma, 'descricao', e.target.value)}
                    className="w-full border rounded px-3 py-1 text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preços e opções */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm">Preço normal</label>
          <input
            type="number"
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="w-full border rounded px-3 py-1"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm">Preço promocional</label>
          <input
            type="number"
            step="0.01"
            value={precoPromocional}
            onChange={(e) => setPrecoPromocional(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={delivery}
            onChange={(e) => setDelivery(e.target.checked)}
          />
          <span className="text-sm">Disponível para delivery</span>
        </label>
      </div>
      <div>
        <label className="block text-sm">Foto</label>
        <ImageUpload
          onUpload={(url) => setFotoUrl(url)}
          defaultImage={fotoUrl}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-orange-600 text-white px-4 py-1 rounded">
          Salvar
        </button>
        <button type="button" onClick={onCancel} className="border px-4 py-1 rounded">
          Cancelar
        </button>
      </div>
    </form>
  )
}