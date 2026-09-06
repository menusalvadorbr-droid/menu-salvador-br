'use client'

import { useEffect, useState } from 'react'
import { listarTraducoesDoItem, salvarTraducaoManual } from '../traducaoRepository'
import { podeUsar } from '../permissoes'

const IDIOMAS = [
  { codigo: 'en', label: 'Inglês' },
  { codigo: 'es', label: 'Espanhol' },
  { codigo: 'fr', label: 'Francês' },
]

export default function TraducaoEditor({ estabelecimento, itemId }: { estabelecimento: { id: string }; itemId: string }) {
  const [carregando, setCarregando] = useState(true)
  const [rascunho, setRascunho] = useState<Record<string, { nome: string; descricao: string }>>({})

  useEffect(() => {
    listarTraducoesDoItem(itemId)
      .then((lista) => {
        const inicial: Record<string, { nome: string; descricao: string }> = {}
        for (const idioma of IDIOMAS) {
          inicial[idioma.codigo] = {
            nome: lista.find((t) => t.idioma === idioma.codigo && t.campo === 'nome')?.texto ?? '',
            descricao: lista.find((t) => t.idioma === idioma.codigo && t.campo === 'descricao')?.texto ?? '',
          }
        }
        setRascunho(inicial)
      })
      .finally(() => setCarregando(false))
  }, [itemId])

  async function salvar(idioma: string) {
    const valores = rascunho[idioma]
    await Promise.all([
      salvarTraducaoManual(itemId, idioma, 'nome', valores.nome),
      salvarTraducaoManual(itemId, idioma, 'descricao', valores.descricao),
    ])
  }

  if (carregando) return <p className="text-xs text-neutral-400">Carregando traduções…</p>
  if (!podeUsar(estabelecimento, 'cardapio_v2.traducao_ia')) return null // reservado — hoje sempre libera, ver permissoes.ts

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3">
      <p className="text-xs font-semibold text-neutral-700">Tradução manual</p>
      {IDIOMAS.map((idioma) => (
        <div key={idioma.codigo} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500">{idioma.label}</span>
          <input
            value={rascunho[idioma.codigo]?.nome ?? ''}
            onChange={(e) => setRascunho((r) => ({ ...r, [idioma.codigo]: { ...r[idioma.codigo], nome: e.target.value } }))}
            placeholder="Nome traduzido"
            className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
          />
          <textarea
            value={rascunho[idioma.codigo]?.descricao ?? ''}
            onChange={(e) => setRascunho((r) => ({ ...r, [idioma.codigo]: { ...r[idioma.codigo], descricao: e.target.value } }))}
            placeholder="Descrição traduzida"
            rows={2}
            className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
          />
          <button onClick={() => salvar(idioma.codigo)} className="self-end text-xs font-medium text-orange-600">Salvar {idioma.label}</button>
        </div>
      ))}
    </div>
  )
}
