// src/app/painel/components/DashboardTab.tsx
'use client'

import Link from 'next/link'

interface DashboardTabProps {
  estabelecimento: any
  categorias: any[]
  limitePlano: number
  recursosDisponiveis: any[]
  recursosAtivos: string[]
  recursosPermitidos: string[]
  toggleRecurso: (slug: string) => void
  planosList: any[]
  limiteGaleria: number
}

export function DashboardTab({
  estabelecimento,
  categorias,
  limitePlano,
  recursosDisponiveis,
  recursosAtivos,
  recursosPermitidos,
  toggleRecurso,
  planosList,
  limiteGaleria,
}: DashboardTabProps) {
  // Calcular total de itens publicados
  const publicados = categorias.reduce((total: number, cat: any) => {
    const itens = cat.itens_cardapio || [];
    return total + itens.filter((i: any) => i.disponivel).length;
  }, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Scans QR Code</p>
          <p className="text-3xl font-bold text-blue-600">{estabelecimento?.scans_qrcode || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Itens Publicados</p>
          <p className="text-3xl font-bold text-orange-600">{publicados} <span className="text-lg text-gray-400">/ {limitePlano}</span></p>
          {publicados >= limitePlano && <p className="text-xs text-red-500 mt-1">Limite atingido. Faça upgrade.</p>}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Categorias</p>
          <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
        </div>
      </div>

      {/* Recursos disponíveis */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🧩 Recursos Ativos</h3>
        <p className="text-sm text-gray-500 mb-4">Ative ou desative funcionalidades que aparecerão no seu menu digital.</p>
        <div className="space-y-3">
          {recursosDisponiveis.map((recurso: any) => {
            const permitido = recursosPermitidos.includes(recurso.slug);
            const ativo = recursosAtivos.includes(recurso.slug);
            return (
              <div key={recurso.slug} className={`p-4 rounded-xl border-2 ${ativo ? 'border-green-500 bg-green-50' : 'border-gray-200'} ${!permitido ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{recurso.nome}</p>
                    <p className="text-xs text-gray-500">{recurso.descricao}</p>
                  </div>
                  <button
                    disabled={!permitido}
                    onClick={() => toggleRecurso(recurso.slug)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${!permitido ? 'cursor-not-allowed' : ''}`}
                  >
                    {ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                {!permitido && <p className="text-xs text-red-500 mt-2">🔒 Não disponível no seu plano</p>}
              </div>
            );
          })}
        </div>
        <Link href="/planos" className="mt-6 inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200">
          ⬆️ Fazer Upgrade
        </Link>
      </div>

      {/* Plano atual */}
      <div className="bg-white rounded-xl p-6 shadow-sm mt-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">💳 Plano Atual</h3>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {planosList.find(p => p.id === estabelecimento?.plano_id)?.nome || 'Grátis'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {limitePlano} itens • {limiteGaleria} imagens na galeria
            </p>
          </div>
          <Link href="/planos" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700">
            ⬆️ Fazer Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}