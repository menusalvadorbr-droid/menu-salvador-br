'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Tema {
  id: string
  nome: string
  slug: string
  descricao: string
  preview_image_url: string | null
  config: any
  tipo: 'free' | 'premium'
  ativo: boolean
}

interface TemaSelectorProps {
  estabelecimentoId: string
  temaAtualId: string | null
  readOnly?: boolean
  onTemaChange?: (temaId: string) => void
}

export default function TemaSelector({
  estabelecimentoId,
  temaAtualId,
  readOnly = false,
  onTemaChange,
}: TemaSelectorProps) {
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState<string | null>(temaAtualId)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    carregarTemas()
  }, [])

  async function carregarTemas() {
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .eq('ativo', true)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao carregar temas:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar temas.' })
    } else {
      setTemas(data || [])
    }
    setLoading(false)
  }

  async function selecionarTema(temaId: string) {
    if (readOnly || salvando) return

    const tema = temas.find((t) => t.id === temaId)
    if (tema?.tipo === 'premium') {
      setMensagem({ tipo: 'error', texto: 'Este tema é Premium. Faça upgrade para usá-lo.' })
      return
    }

    setSalvando(true)
    setMensagem(null)

    const { error } = await supabase
      .from('estabelecimentos')
      .update({ tema_atual_id: temaId })
      .eq('id', estabelecimentoId)

    if (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar tema: ' + error.message })
    } else {
      setSelecionado(temaId)
      setMensagem({ tipo: 'success', texto: '✅ Tema atualizado com sucesso!' })
      if (onTemaChange) onTemaChange(temaId)
    }
    setSalvando(false)
  }

  if (loading) return <div className="text-gray-500 text-center py-8">Carregando temas...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎨 Tema do Cardápio</h3>
        {mensagem && (
          <span className={`text-sm ${mensagem.tipo === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {mensagem.texto}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {temas.map((tema) => {
          const isSelected = selecionado === tema.id
          const isPremium = tema.tipo === 'premium'
          const config = tema.config || {}

          return (
            <div
              key={tema.id}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300 hover:shadow'
              } ${readOnly ? 'cursor-default opacity-70' : ''}`}
              onClick={() => !readOnly && selecionarTema(tema.id)}
            >
              {tema.preview_image_url && (
                <div className="h-24 w-full rounded-lg overflow-hidden mb-3 bg-gray-100">
                  <img src={tema.preview_image_url} alt={tema.nome} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{tema.nome}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{tema.descricao || ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isPremium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isPremium ? '🔒 Premium' : 'Grátis'}
                    </span>
                    {isSelected && <span className="text-xs text-orange-600 font-medium">✅ Selecionado</span>}
                  </div>
                </div>
                {config.cor_primaria && (
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: config.cor_primaria }} />
                    {config.cor_secundaria && (
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: config.cor_secundaria }} />
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Layout: {config.layout || 'grade'} • Fonte: {config.fonte || 'padrão'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}