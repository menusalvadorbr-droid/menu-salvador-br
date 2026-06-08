// src/app/admin/components/TabelaDistribuicao.tsx
'use client'

interface TabelaDistribuicaoProps {
  estabelecimentos: any[]
}

export function TabelaDistribuicao({ estabelecimentos }: TabelaDistribuicaoProps) {
  const tipos = [
    { chave: 'restaurante', nome: 'Restaurantes' },
    { chave: 'bar', nome: 'Bares' },
    { chave: 'cafeteria', nome: 'Cafeterias' },
    { chave: 'banca_acaraje', nome: 'Bancas de Acarajé' },
    { chave: 'foodtruck', nome: 'Food Trucks' },
    { chave: 'lanchonete', nome: 'Lanchonetes' },
  ]

  const bairrosStats: Record<string, Record<string, number>> = {}
  estabelecimentos.forEach((est) => {
    const bairro = est.bairro || 'Outros'
    const tipo = est.tipo_estabelecimento || 'outro'
    if (!bairrosStats[bairro]) bairrosStats[bairro] = {}
    bairrosStats[bairro][tipo] = (bairrosStats[bairro][tipo] || 0) + 1
    bairrosStats[bairro]._total = (bairrosStats[bairro]._total || 0) + 1
  })

  const bairrosArray = Object.entries(bairrosStats)
    .sort(([, a], [, b]) => (b._total || 0) - (a._total || 0))
    .slice(0, 10)

  const totalGeral = estabelecimentos.length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto mt-6">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">📊 Distribuição por Bairro e Tipo</h2>
        <p className="text-sm text-gray-500">Total geral: {totalGeral} estabelecimentos</p>
      </div>
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 text-sm">Bairro</th>
            <th className="text-left p-3 text-sm">Total</th>
            {tipos.map((t) => (
              <th key={t.chave} className="text-left p-3 text-sm">{t.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bairrosArray.map(([bairro, stats]) => (
            <tr key={bairro} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{bairro}</td>
              <td className="p-3">{stats._total || 0}</td>
              {tipos.map((t) => (
                <td key={t.chave} className="p-3">{stats[t.chave] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}