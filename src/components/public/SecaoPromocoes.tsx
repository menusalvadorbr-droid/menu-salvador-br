import Image from 'next/image'
import { Texto, TextoInterface } from './TraducaoCardapio'

interface ItemPromo {
  id: string
  nome: string
  foto_url: string | null
  preco: number
  preco_promocional: number | null
}

export default function SecaoPromocoes({ promocoes }: { promocoes: ItemPromo[] }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        🎉 <TextoInterface chave="secao_promocoes">Promoções</TextoInterface>
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {promocoes.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3">
            {item.foto_url && (
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                <Image src={item.foto_url} alt={item.nome} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                <Texto tipo="item" id={item.id} campo="nome">
                  {item.nome}
                </Texto>
              </p>
              <p className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                R$ {(item.preco_promocional ?? item.preco)?.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
