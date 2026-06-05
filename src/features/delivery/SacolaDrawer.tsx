'use client'

interface ItemSacola {
  id: string
  nome: string
  preco: number
  preco_promocional?: number
  quantidade: number
  observacao?: string
}

interface SacolaDrawerProps {
  aberto: boolean
  itens: ItemSacola[]
  total: number
  onFechar: () => void
  onRemover: (id: string) => void
  onAlterarQuantidade: (id: string, delta: number) => void
  onFinalizar: () => void
}

export default function SacolaDrawer({
  aberto,
  itens,
  total,
  onFechar,
  onRemover,
  onAlterarQuantidade,
  onFinalizar,
}: SacolaDrawerProps) {
  if (!aberto) return null

  // No return do SacolaDrawer, substitua a div raiz por:

return (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    {/* Overlay escuro */}
    <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
    
    {/* Painel da sacola */}
    <div className="relative w-full sm:max-w-md max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">🛒 Minha Sacola</h2>
        <button onClick={onFechar} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
      </div>
      
      {/* Itens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {itens.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">Sacola vazia</p>
        ) : (
          itens.map(item => {
            const preco = item.preco_promocional && item.preco_promocional < item.preco
              ? item.preco_promocional
              : item.preco
            return (
              <div key={item.id} className="flex justify-between items-center border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.nome}</p>
                  <p className="text-sm text-gray-500">
                    R$ {preco.toFixed(2)} x {item.quantidade}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAlterarQuantidade(item.id, -1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantidade}</span>
                  <button
                    onClick={() => onAlterarQuantidade(item.id, 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemover(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Rodapé com total e botão */}
      <div className="border-t p-4">
        <div className="flex justify-between font-bold text-lg mb-4">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={onFinalizar}
          disabled={itens.length === 0}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
        >
          📦 Finalizar Pedido
        </button>
      </div>
    </div>
  </div>
)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">🛒 Minha Sacola</h2>
          <button onClick={onFechar} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {itens.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">Sacola vazia</p>
          ) : (
            itens.map(item => {
              const preco = item.preco_promocional && item.preco_promocional < item.preco
                ? item.preco_promocional
                : item.preco
              return (
                <div key={item.id} className="flex justify-between items-center border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      R$ {preco.toFixed(2)} x {item.quantidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAlterarQuantidade(item.id, -1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => onAlterarQuantidade(item.id, 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemover(item.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="border-t p-4">
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={onFinalizar}
            disabled={itens.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            📦 Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}