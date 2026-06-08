// src/app/admin/components/TabelaEstabelecimentos.tsx
'use client'

interface TabelaEstabelecimentosProps {
  estabelecimentos: any[]
  planos: any[]
  ordenacao: { coluna: string | null; direcao: 'asc' | 'desc' }
  onOrdenar: (coluna: string) => void
  onToggleStatus: (id: string, ativo: boolean) => void
  onToggleDestaque: (id: string, destaque: boolean) => void
  onExcluir: (id: string, nome: string) => void
  onEditar: (estabelecimento: any) => void
}

export function TabelaEstabelecimentos({
  estabelecimentos,
  planos,
  ordenacao,
  onOrdenar,
  onToggleStatus,
  onToggleDestaque,
  onExcluir,
  onEditar,
}: TabelaEstabelecimentosProps) {
  const colunas = [
    { chave: 'nome', label: 'Nome' },
    { chave: 'bairro', label: 'Bairro' },
    { chave: 'tipo_cozinha', label: 'Tipo' },
    { chave: 'plano_id', label: 'Plano' },
    { chave: 'qrcode_short_url', label: 'QR Code' },
    { chave: 'scans_qrcode', label: 'Scans' },
    { chave: 'ativo', label: 'Status' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50">
          <tr>
            {colunas.map((col) => (
              <th
                key={col.chave}
                className="text-left p-4 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => onOrdenar(col.chave)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {ordenacao.coluna === col.chave && (
                    <span className="text-orange-500">
                      {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {estabelecimentos.map((est) => {
            const nomePlano = planos.find(p => p.id === est.plano_id)?.nome || 'Grátis'
            return (
              <tr key={est.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">
                  <button onClick={() => onEditar(est)} className="text-blue-600 hover:underline text-left">
                    {est.nome}
                  </button>
                </td>
                <td className="p-4 text-sm">{est.bairro}</td>
                <td className="p-4 text-sm">{est.tipo_cozinha}</td>
                <td className="p-4 text-sm font-medium">{nomePlano}</td>
                <td className="p-4 text-xs font-mono">{est.qrcode_short_url || 'N/A'}</td>
                <td className="p-4 text-sm">{est.scans_qrcode || 0}</td>
                <td className="p-4">
                  <button
                    onClick={() => onToggleStatus(est.id, est.ativo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      est.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {est.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => onToggleDestaque(est.id, est.destaque)}
                      className={est.destaque ? 'text-yellow-500' : 'text-gray-400'}
                      title="Destacar"
                    >
                      {est.destaque ? '⭐' : '☆'}
                    </button>
                    <a href={`/menu/${est.qrcode_short_url}`} target="_blank" className="text-blue-600 hover:text-blue-800" title="Ver cardápio">📱</a>
                    <button onClick={() => onEditar(est)} className="text-orange-500 hover:text-orange-700" title="Editar dados">✏️</button>
                    <button onClick={() => onExcluir(est.id, est.nome)} className="text-red-500 hover:text-red-700" title="Excluir">🗑️</button>
                  </div>
                </td>
              </tr>
            )
          })}
          {estabelecimentos.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">Nenhum estabelecimento cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}