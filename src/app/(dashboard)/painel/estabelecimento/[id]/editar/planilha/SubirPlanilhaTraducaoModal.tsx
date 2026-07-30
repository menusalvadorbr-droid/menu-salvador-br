'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import {
  lerPlanilhaTraducao,
  compararTraducoes,
  aplicarPlanoTraducao,
  type CategoriaTraducao,
  type ItemTraducao,
  type TraducaoExistente,
  type PlanoTraducao,
} from './planilhaTraducao'

const IDIOMA_LABEL: Record<string, string> = { en: 'inglês', fr: 'francês', es: 'espanhol' }

interface SubirPlanilhaTraducaoModalProps {
  estabelecimentoId: string
  categorias: CategoriaTraducao[]
  itens: ItemTraducao[]
  traducoesExistentes: TraducaoExistente[]
  onFechar: () => void
  onConcluido: () => Promise<void>
}

type Etapa = 'selecionar' | 'lendo' | 'revisao' | 'aplicando'

export default function SubirPlanilhaTraducaoModal({
  estabelecimentoId,
  categorias,
  itens,
  traducoesExistentes,
  onFechar,
  onConcluido,
}: SubirPlanilhaTraducaoModalProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [linhasIgnoradas, setLinhasIgnoradas] = useState<{ linha: number; motivo: string }[]>([])
  const [plano, setPlano] = useState<PlanoTraducao | null>(null)
  const [erroAplicar, setErroAplicar] = useState<string | null>(null)

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setEtapa('lendo')
    setErroArquivo(null)

    try {
      const { linhas, erros } = await lerPlanilhaTraducao(arquivo)

      if (linhas.length === 0) {
        setErroArquivo(erros[0]?.motivo || 'Não encontrei nenhuma linha válida nessa planilha.')
        setEtapa('selecionar')
        return
      }

      setLinhasIgnoradas(erros)
      setPlano(compararTraducoes(linhas, categorias, itens, traducoesExistentes))
      setEtapa('revisao')
    } catch (err) {
      logSupabaseError('Erro ao ler planilha de tradução', err)
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

    const { erro } = await aplicarPlanoTraducao(supabase, estabelecimentoId, plano)

    if (erro) {
      setErroAplicar(erro)
      setEtapa('revisao')
      return
    }

    await onConcluido()
    onFechar()
  }

  const idiomasComMudanca = plano ? Object.keys(plano.porIdioma) : []
  const totalMudancas = plano ? plano.upserts.length : 0
  const semMudancas = plano !== null && totalMudancas === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onFechar}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Subir planilha de tradução</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {(etapa === 'selecionar' || etapa === 'lendo') && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Selecione o arquivo .xlsx preenchido. Só células com texto preenchido são consideradas — célula em
              branco não apaga uma tradução que já existe. Nada é gravado ainda — a próxima tela mostra um resumo
              por idioma pra você confirmar antes.
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
              {semMudancas ? (
                'Nenhuma mudança encontrada — a planilha já bate com as traduções salvas.'
              ) : (
                <ul className="space-y-1">
                  {idiomasComMudanca.map((idi) => {
                    const { novas, alteradas } = plano.porIdioma[idi]
                    const partes = []
                    if (novas > 0) partes.push(`${novas} ${novas === 1 ? 'nova' : 'novas'}`)
                    if (alteradas > 0) partes.push(`${alteradas} ${alteradas === 1 ? 'alterada' : 'alteradas'}`)
                    const total = novas + alteradas
                    return (
                      <li key={idi}>
                        {partes.join(' + ')} {total === 1 ? 'tradução' : 'traduções'} em{' '}
                        {IDIOMA_LABEL[idi] || idi}
                      </li>
                    )
                  })}
                </ul>
              )}
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

            {plano.linhasNaoEncontradas.length > 0 && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-600">
                  {plano.linhasNaoEncontradas.length} {plano.linhasNaoEncontradas.length === 1 ? 'linha não encontrada' : 'linhas não encontradas'} no cardápio atual (clique pra ver)
                </summary>
                <ul className="mt-1 space-y-0.5 pl-4">
                  {plano.linhasNaoEncontradas.map((e) => (
                    <li key={e.linha}>Linha {e.linha}: {e.descricao}</li>
                  ))}
                </ul>
              </details>
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
