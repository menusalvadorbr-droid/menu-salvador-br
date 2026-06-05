// src/app/teste-diagnostico/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TabelaStatus = {
  nome: string
  existe: boolean
  registros: number
  erro?: string
  colunas?: string[]
}

export default function DiagnosticoPage() {
  const [resultados, setResultados] = useState<TabelaStatus[]>([])
  const [loading, setLoading] = useState(true)

  const tabelas = [
    'planos',
    'temas',
    'modelos_qrcode',
    'recursos_menu',
    'estabelecimentos',
    'usuarios',
    'menus',
    'categorias',
    'itens_cardapio',
    'scans_qrcode',
    'admins',
  ]

  useEffect(() => {
    async function verificar() {
      const res: TabelaStatus[] = []
      for (const tabela of tabelas) {
        try {
          const { data, error, count } = await supabase
            .from(tabela)
            .select('*', { count: 'exact', head: true })
          res.push({
            nome: tabela,
            existe: !error,
            registros: count ?? 0,
            erro: error?.message,
          })
        } catch (e: any) {
          res.push({ nome: tabela, existe: false, registros: 0, erro: e.message })
        }
      }
      setResultados(res)
      setLoading(false)
    }
    verificar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🩺 Diagnóstico do Supabase</h1>
        {loading ? (
          <p>Verificando tabelas...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Tabela</th>
                  <th className="text-left p-4">Existe?</th>
                  <th className="text-left p-4">Registros</th>
                  <th className="text-left p-4">Erro</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.nome} className="border-t">
                    <td className="p-4 font-mono text-sm">{r.nome}</td>
                    <td className="p-4">{r.existe ? '✅ Sim' : '❌ Não'}</td>
                    <td className="p-4">{r.registros}</td>
                    <td className="p-4 text-xs text-red-600">{r.erro || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}