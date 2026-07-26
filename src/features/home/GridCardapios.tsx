// src/features/home/GridCardapios.tsx
import BotaoAdicionarCarrinho from '@/modules/pedidos/customer/BotaoAdicionarCarrinho'
import StatusPill from '@/components/public/StatusPill'

interface ItemCardapio {
  id: string
  nome: string
  descricao: string
  preco: number
  imageUrl: string
  estabelecimento: {
    nome: string
    aberto: boolean
  }
}

export function GridCardapios({ itens }: { itens: ItemCardapio[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {itens.map((item) => (
        <div key={item.id} className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <img src={item.imageUrl} className="w-full h-40 object-cover rounded-xl" alt={item.nome} />
          <div className="mt-3 flex justify-between items-center">
            <h3 className="font-bold">{item.nome}</h3>
            <StatusPill aberto={item.estabelecimento.aberto} mensagem={item.estabelecimento.aberto ? 'Aberto' : 'Fechado'} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{item.descricao}</p>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-lg text-orange-600">R$ {item.preco.toFixed(2)}</span>
            <BotaoAdicionarCarrinho
              id={item.id}
              nome={item.nome}
              preco={item.preco}
              corDestaque="#f97316"
            />
          </div>
        </div>
      ))}
    </div>
  )
}