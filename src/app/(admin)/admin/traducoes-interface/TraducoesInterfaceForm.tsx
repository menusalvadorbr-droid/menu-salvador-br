'use client'

import { useState, useTransition } from 'react'
import { GRUPOS_CHAVES, IDIOMAS } from './chaves'
import { salvarTraducoesInterface, type TraducaoInterfaceAlteracao } from './actions'
import AdminAcordeaoSecao from '@/components/admin/AdminAcordeaoSecao'

type Valores = Record<string, { en: string; fr: string; es: string }>

export default function TraducoesInterfaceForm({ valoresIniciais }: { valoresIniciais: Valores }) {
  const [valores, setValores] = useState<Valores>(valoresIniciais)
  const [isPending, startTransition] = useTransition()
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function alterar(chave: string, idioma: 'en' | 'fr' | 'es', valor: string) {
    setValores((prev) => ({
      ...prev,
      [chave]: { ...(prev[chave] || { en: '', fr: '', es: '' }), [idioma]: valor },
    }))
    setSalvo(false)
  }

  function salvarTudo() {
    const alteracoes: TraducaoInterfaceAlteracao[] = []
    for (const grupo of GRUPOS_CHAVES) {
      for (const { chave } of grupo.chaves) {
        const linha = valores[chave] || { en: '', fr: '', es: '' }
        for (const { codigo } of IDIOMAS) {
          alteracoes.push({ chave, idioma: codigo, valor: linha[codigo] || '' })
        }
      }
    }

    setErro(null)
    startTransition(async () => {
      try {
        await salvarTraducoesInterface(alteracoes)
        setSalvo(true)
        setTimeout(() => setSalvo(false), 2500)
      } catch (e: any) {
        setErro(e.message || 'Erro ao salvar.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 py-3">
        <button
          type="button"
          onClick={salvarTudo}
          disabled={isPending}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar todas as traduções'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
        {erro && <span className="text-sm text-red-600">{erro}</span>}
      </div>

      {GRUPOS_CHAVES.map((grupo, index) => (
        <AdminAcordeaoSecao
          key={grupo.grupo}
          titulo={grupo.grupo}
          contador={`${grupo.chaves.length} chaves`}
          abertoInicialmente={index === 0}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-400">
                  <th className="py-2 pr-3 font-medium">Chave</th>
                  <th className="py-2 pr-3 font-medium">Português (original)</th>
                  {IDIOMAS.map((i) => (
                    <th key={i.codigo} className="py-2 pr-3 font-medium">{i.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupo.chaves.map(({ chave, textoPt }) => {
                  const linha = valores[chave] || { en: '', fr: '', es: '' }
                  return (
                    <tr key={chave} className="border-b border-neutral-50 align-top">
                      <td className="py-2 pr-3 font-mono text-xs text-neutral-400">{chave}</td>
                      <td className="py-2 pr-3 text-neutral-600">{textoPt}</td>
                      {IDIOMAS.map(({ codigo }) => (
                        <td key={codigo} className="py-2 pr-3">
                          <input
                            type="text"
                            value={linha[codigo]}
                            onChange={(e) => alterar(chave, codigo, e.target.value)}
                            placeholder={textoPt}
                            className="w-full min-w-[160px] rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AdminAcordeaoSecao>
      ))}

      <div className="flex items-center gap-3 pb-6">
        <button
          type="button"
          onClick={salvarTudo}
          disabled={isPending}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar todas as traduções'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
        {erro && <span className="text-sm text-red-600">{erro}</span>}
      </div>
    </div>
  )
}
