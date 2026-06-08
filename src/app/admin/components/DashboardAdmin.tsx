// src/app/admin/components/DashboardAdmin.tsx
'use client'

interface DashboardAdminProps {
  stats: { total: number; ativos: number; inativos: number; scans: number }
  estabelecimentos: any[]
}

function TabelaDistribuicao({ estabelecimentos }: { estabelecimentos: any[] }) {
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

export function DashboardAdmin({ stats, estabelecimentos }: DashboardAdminProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Ativos</p>
          <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Inativos</p>
          <p className="text-3xl font-bold text-red-600">{stats.inativos}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">Scans QR</p>
          <p className="text-3xl font-bold text-blue-600">{stats.scans}</p>
        </div>
      </div>
      <TabelaDistribuicao estabelecimentos={estabelecimentos} />
    </div>
  )
}