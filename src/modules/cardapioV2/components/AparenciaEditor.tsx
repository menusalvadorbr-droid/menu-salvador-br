'use client'

import { useState } from 'react'
import { ImageUpload } from '@/app/(dashboard)/painel/components/upload/ImageUpload'
import { FONTES_TEMA } from '@/lib/fontesTema'
import { atualizarAparencia } from '../cardapioRepository'
import type { AparenciaCardapio, CardapioV2Cardapio, FormatoExibicaoCardapio, FotoItemPosicao } from '../types'

/**
 * Cada mudança aplica na hora via onAtualizado (estado do pai, sem ida ao
 * banco) — o preview ao lado (ver aba "Aparência" em page.tsx) reflete
 * instantaneamente, mesmo padrão de customizador ao vivo usado pelo
 * WordPress Customizer/editor de temas do Shopify (sidebar de controles +
 * preview lado a lado, "Salvar/Publicar" como ação separada da edição em
 * si). Edição direta, sem catálogo de temas curado por admin como o V1
 * tem — decisão deliberada, ver cardapio-v2-visao.md.
 */
export default function AparenciaEditor({
  cardapio,
  onAtualizado,
}: {
  cardapio: CardapioV2Cardapio
  onAtualizado: (cardapio: CardapioV2Cardapio) => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function atualizarCampo<K extends keyof AparenciaCardapio>(campo: K, valor: AparenciaCardapio[K]) {
    onAtualizado({ ...cardapio, [campo]: valor })
  }

  async function handleSalvar() {
    setSalvando(true)
    setSalvo(false)
    try {
      await atualizarAparencia(cardapio.id, {
        cor_primaria: cardapio.cor_primaria,
        cor_fundo: cardapio.cor_fundo,
        cor_texto: cardapio.cor_texto,
        fonte: cardapio.fonte,
        capa_url: cardapio.capa_url,
        titulo_exibicao: cardapio.titulo_exibicao,
        formato_exibicao: cardapio.formato_exibicao,
        foto_item_posicao: cardapio.foto_item_posicao,
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Cor principal</label>
          <input type="color" value={cardapio.cor_primaria} onChange={(e) => atualizarCampo('cor_primaria', e.target.value)} className="h-9 w-full rounded-lg border border-neutral-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Fundo</label>
          <input type="color" value={cardapio.cor_fundo} onChange={(e) => atualizarCampo('cor_fundo', e.target.value)} className="h-9 w-full rounded-lg border border-neutral-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Texto</label>
          <input type="color" value={cardapio.cor_texto} onChange={(e) => atualizarCampo('cor_texto', e.target.value)} className="h-9 w-full rounded-lg border border-neutral-200" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Fonte</label>
        <select value={cardapio.fonte} onChange={(e) => atualizarCampo('fonte', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
          {FONTES_TEMA.map((f) => (
            <option key={f.nome} value={f.nome}>{f.nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Título exibido (opcional)</label>
        <input
          value={cardapio.titulo_exibicao ?? ''}
          onChange={(e) => atualizarCampo('titulo_exibicao', e.target.value || null)}
          placeholder="Padrão: nome do estabelecimento"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Imagem de capa (opcional)</label>
        <ImageUpload onUpload={(url) => atualizarCampo('capa_url', url || null)} defaultImage={cardapio.capa_url} shape="rectangle" label="Enviar capa" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Formato de exibição</label>
        <div className="flex gap-2">
          {(['lista', 'catalogo'] satisfies FormatoExibicaoCardapio[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => atualizarCampo('formato_exibicao', opcao)}
              className={`rounded-lg px-3 py-1.5 text-sm ${cardapio.formato_exibicao === opcao ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
            >
              {opcao === 'lista' ? 'Lista' : 'Catálogo'}
            </button>
          ))}
        </div>
      </div>

      {cardapio.formato_exibicao === 'lista' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Posição da foto do item</label>
          <div className="flex flex-wrap gap-2">
            {([
              { valor: 'left', label: 'Esquerda' },
              { valor: 'right', label: 'Direita' },
              { valor: 'top', label: 'Em cima' },
              { valor: 'none', label: 'Sem foto' },
            ] satisfies { valor: FotoItemPosicao; label: string }[]).map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => atualizarCampo('foto_item_posicao', opcao.valor)}
                className={`rounded-lg px-3 py-1.5 text-sm ${cardapio.foto_item_posicao === opcao.valor ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSalvar}
        disabled={salvando}
        className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : salvo ? 'Salvo!' : 'Salvar aparência'}
      </button>
    </div>
  )
}
