'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import {
  lerPlanilhaCardapio,
  compararComEstado,
  aplicarPlanoPlanilha,
  type CategoriaPlanilha,
  type ItemPlanilha,
  type PlanoAplicacao,
  type LinhaPlanilhaLida,
} from './planilhaCardapio'

interface SubirPlanilhaModalProps {
  menuId: string
  categorias: CategoriaPlanilha[]
  itens: ItemPlanilha[]
  onFechar: () => void
  onConcluido: () => Promise<void>
}

type Etapa = 'selecionar' | 'lendo' | 'revisao' | 'aplicando'

export default function SubirPlanilhaModal({ menuId, categorias, itens, onFechar, onConcluido }: SubirPlanilhaModalProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [linhasIgnoradas, setLinhasIgnoradas] = useState<{ linha: number; motivo: string }[]>([])
  const [plano, setPlano] = useState<PlanoAplicacao | null>(null)
  const [erroAplicar, setErroAplicar] = useState<string | null>(null)

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setEtapa('lendo')
    setErroArquivo(null)

    try {
      const { linhas, erros } = await lerPlanilhaCardapio(arquivo)

      if (linhas.length === 0) {
        setErroArquivo(
          erros[0]?.motivo || 'Não encontrei nenhuma linha válida nessa planilha.'
        )
        setEtapa('selecionar')
        return
      }

      setLinhasIgnoradas(erros)
      setPlano(compararComEstado(linhas, categorias, itens))
      setEtapa('revisao')
    } catch (err) {
      logSupabaseError('Erro ao ler planilha', err)
      setErroArquivo('Não consegui ler esse arquivo — confira se é mesmo um .xlsx exportado daqui.')
      setEtapa('selecionar')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function confirmar() {
    if (!plano) return
    setEtapa('aplicando')
    setErroAplicar(null)

    const { erro } = await aplicarPlanoPlanilha(supabase, { menuId, categorias, itens, plano })

    if (erro) {
      setErroAplicar(erro)
      setEtapa('revisao')
      return
    }

    // Espera o pai recarregar categorias/itens antes de fechar — sem isso,
    // reabrir "Subir planilha" logo em seguida (ou reenviar rápido) podia
    // comparar contra o estado antigo, ainda sem os itens recém-criados/
    // atualizados, e mostrar diferenças que já não existem mais.
    await onConcluido()
    onFechar()
  }

  const semMudancas = plano && plano.categoriasNovas.length === 0 && plano.itensNovos.length === 0 && plano.itensAlterados.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onFechar}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Subir planilha</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {(etapa === 'selecionar' || etapa === 'lendo') && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Selecione o arquivo .xlsx. Categorias e itens que ainda não existem são criados; itens que já
              existem têm descrição, preço e disponibilidade atualizados. Nada é gravado ainda — a próxima tela
              mostra um resumo pra você confirmar antes.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              onChange={handleArquivo}
              disabled={etapa === 'lendo'}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-700"
            />
            {etapa === 'lendo' && <p className="text-sm text-gray-400">Lendo planilha…</p>}
            {erroArquivo && <p className="text-sm text-red-600">{erroArquivo}</p>}
          </div>
        )}

        {(etapa === 'revisao' || etapa === 'aplicando') && plano && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium text-orange-800">
              {semMudancas
                ? 'Nenhuma mudança encontrada — a planilha já bate com o cardápio atual.'
                : `${plano.itensNovos.length} ${plano.itensNovos.length === 1 ? 'item novo' : 'itens novos'}, ` +
                  `${plano.itensAlterados.length} ${plano.itensAlterados.length === 1 ? 'item alterado' : 'itens alterados'}, ` +
                  `${plano.categoriasNovas.length} ${plano.categoriasNovas.length === 1 ? 'categoria nova' : 'categorias novas'}`}
            </div>

            {linhasIgnoradas.length > 0 && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-600">
                  {linhasIgnoradas.length} {linhasIgnoradas.length === 1 ? 'linha ignorada' : 'linhas ignoradas'} (clique pra ver)
                </summary>
                <ul className="mt-1 space-y-0.5 pl-4">
                  {linhasIgnoradas.map((e, i) => (
                    <li key={i}>Linha {e.linha}: {e.motivo}</li>
                  ))}
                </ul>
              </details>
            )}

            {plano.categoriasNovas.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Categorias novas</p>
                <ul className="space-y-0.5 text-sm text-gray-700">
                  {plano.categoriasNovas.map((nome) => <li key={nome}>+ {nome}</li>)}
                </ul>
              </div>
            )}

            {plano.itensNovos.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Itens novos</p>
                <ul className="max-h-40 space-y-0.5 overflow-y-auto text-sm text-gray-700">
                  {plano.itensNovos.map(({ linha }: { linha: LinhaPlanilhaLida }) => (
                    <li key={linha.linha}>+ {linha.nome} <span className="text-gray-400">({linha.categoriaNome})</span></li>
                  ))}
                </ul>
              </div>
            )}

            {plano.itensAlterados.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Itens alterados</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-gray-700">
                  {plano.itensAlterados.map(({ itemId, linha, mudancas }) => (
                    <li key={itemId}>
                      <span className="font-medium">{linha.nome}</span>
                      <span className="block text-xs text-gray-400">{mudancas.join(' · ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {erroAplicar && <p className="text-sm text-red-600">{erroAplicar}</p>}

            <div className="flex gap-2 pt-2">
              {semMudancas ? (
                <button onClick={onFechar} className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-white hover:bg-gray-700">
                  Fechar
                </button>
              ) : (
                <>
                  <button
                    onClick={onFechar}
                    disabled={etapa === 'aplicando'}
                    className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={etapa === 'aplicando'}
                    className="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {etapa === 'aplicando' ? 'Aplicando…' : 'Confirmar e aplicar'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
