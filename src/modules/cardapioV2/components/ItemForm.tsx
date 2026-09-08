'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { salvarItem, atualizarAlergenosDoItem, atualizarTagsDoItem } from '../itemRepository'
import { listarAlergenos } from '../alergenoRepository'
import { listarGruposComplemento, type GrupoComplementoComOpcoes } from '../grupoComplementoRepository'
import RegraExibicaoEditor from './RegraExibicaoEditor'
import TraducaoEditor from './TraducaoEditor'
import UploadImagemV2 from './UploadImagemV2'
import VariacaoEditor from './VariacaoEditor'
import type { CardapioV2Alergeno, CardapioV2ItemCompleto, CardapioV2VariacaoInput, RecursosOpcionaisCardapio } from '../types'

/**
 * Modal única pra criar/editar item — nome, descrição, foto, preço,
 * variações e vínculo de grupos de complemento vão juntos numa RPC
 * transacional só (salvarItem). Depois do primeiro save, o item passa a
 * ter id e a modal libera as seções que dependem dele (regra de exibição,
 * tradução) sem fechar — evita 2 fluxos separados de "criar" vs "editar".
 *
 * `recursos` vem do cardápio (ver ConfiguracoesCardapio.tsx) — cada seção
 * opcional (alérgenos/nutricional/tags/tradução) só aparece se o dono
 * ativou aquele recurso, em vez de mostrar tudo sempre.
 */
export default function ItemForm({
  estabelecimento,
  categoriaId,
  itemExistente,
  recursos,
  onClose,
  onSalvo,
}: {
  estabelecimento: { id: string }
  categoriaId: string
  itemExistente: CardapioV2ItemCompleto | null
  recursos: RecursosOpcionaisCardapio
  onClose: () => void
  onSalvo: () => void
}) {
  const [itemId, setItemId] = useState<string | null>(itemExistente?.id ?? null)
  const [nome, setNome] = useState(itemExistente?.nome ?? '')
  const [descricao, setDescricao] = useState(itemExistente?.descricao ?? '')
  const [observacaoNutricional, setObservacaoNutricional] = useState(itemExistente?.observacao_nutricional ?? '')
  const [fotoUrl, setFotoUrl] = useState(itemExistente?.foto_url ?? '')
  const [precoBase, setPrecoBase] = useState(itemExistente?.preco_base?.toString() ?? '0')
  const [variacoes, setVariacoes] = useState<CardapioV2VariacaoInput[]>(
    itemExistente?.variacoes.map((v) => ({ nome: v.nome, preco: v.preco, ordem: v.ordem })) ?? []
  )
  const [grupoIdsSelecionados, setGrupoIdsSelecionados] = useState<string[]>(itemExistente?.grupos_complemento_ids ?? [])
  const [alergenoIdsSelecionados, setAlergenoIdsSelecionados] = useState<string[]>(itemExistente?.alergeno_ids ?? [])
  const [tagsTexto, setTagsTexto] = useState((itemExistente?.tags ?? []).join(', '))

  const [alergenos, setAlergenos] = useState<CardapioV2Alergeno[]>([])
  const [grupos, setGrupos] = useState<GrupoComplementoComOpcoes[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (recursos.alergenos_ativado) listarAlergenos().then(setAlergenos)
    listarGruposComplemento(estabelecimento.id).then(setGrupos)
  }, [estabelecimento.id, recursos.alergenos_ativado])

  async function handleSalvar() {
    if (!nome.trim()) {
      setErro('Nome é obrigatório.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const novoId = await salvarItem(
        estabelecimento.id,
        {
          id: itemId ?? undefined,
          categoria_id: categoriaId,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          foto_url: fotoUrl || null,
          observacao_nutricional: observacaoNutricional.trim() || null,
          preco_base: Number(precoBase) || 0,
        },
        variacoes.filter((v) => v.nome.trim()),
        grupoIdsSelecionados
      )
      await Promise.all([
        atualizarAlergenosDoItem(novoId, alergenoIdsSelecionados),
        atualizarTagsDoItem(
          novoId,
          tagsTexto.split(',').map((t) => t.trim()).filter(Boolean)
        ),
      ])
      setItemId(novoId)
      onSalvo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar item.')
    } finally {
      setSalvando(false)
    }
  }

  function alternarSelecao(lista: string[], id: string): string[] {
    return lista.includes(id) ? lista.filter((v) => v !== id) : [...lista, id]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={itemId ? 'Editar item' : 'Novo item'}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">{itemId ? 'Editar item' : 'Novo item'}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>

          {recursos.info_nutricional_ativado && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Observação nutricional</label>
              <input
                value={observacaoNutricional}
                onChange={(e) => setObservacaoNutricional(e.target.value)}
                placeholder="Ex: 450 kcal por porção"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Foto</label>
            <UploadImagemV2
              estabelecimentoId={estabelecimento.id}
              pasta="itens"
              onUpload={setFotoUrl}
              defaultImage={fotoUrl || null}
              shape="rectangle"
              label="Enviar foto"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Preço base</label>
            <input type="number" step="0.01" value={precoBase} onChange={(e) => setPrecoBase(e.target.value)} className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>

          <VariacaoEditor variacoes={variacoes} onChange={setVariacoes} />

          {grupos.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Grupos de complemento</label>
              <div className="flex flex-wrap gap-1.5">
                {grupos.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGrupoIdsSelecionados((atual) => alternarSelecao(atual, g.id))}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      grupoIdsSelecionados.includes(g.id) ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {g.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recursos.alergenos_ativado && alergenos.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Alérgenos</label>
              <div className="flex flex-wrap gap-1.5">
                {alergenos.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setAlergenoIdsSelecionados((atual) => alternarSelecao(atual, a.id))}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      alergenoIdsSelecionados.includes(a.id) ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {a.icone ? `${a.icone} ` : ''}{a.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recursos.tags_ativado && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Tags (separadas por vírgula)</label>
              <input value={tagsTexto} onChange={(e) => setTagsTexto(e.target.value)} placeholder="vegano, sem glúten" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar item'}
          </button>

          {itemId && (
            <>
              <hr className="my-1 border-neutral-100" />
              <RegraExibicaoEditor estabelecimentoId={estabelecimento.id} itemId={itemId} />
              {recursos.traducao_ativado && <TraducaoEditor estabelecimento={estabelecimento} itemId={itemId} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
