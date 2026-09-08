import { resolverEstadoExibicao } from '@/modules/cardapioV2/regrasExibicao'
import type {
  CanalCardapioV2,
  CardapioV2Alergeno,
  CardapioV2Cardapio,
  CardapioV2CategoriaComItens,
  CardapioV2GrupoComplementoResolvido,
} from '@/modules/cardapioV2/types'
import ItemCard from './ItemCard'

export default function CategoriaSecao({
  categoria,
  canal,
  alergenos,
  cardapio,
  agora,
  gruposComplemento,
  carrinhoAtivo = false,
}: {
  categoria: CardapioV2CategoriaComItens
  canal: CanalCardapioV2
  alergenos: CardapioV2Alergeno[]
  cardapio: CardapioV2Cardapio
  agora: Date
  gruposComplemento?: CardapioV2GrupoComplementoResolvido[]
  carrinhoAtivo?: boolean
}) {
  const estadoCategoria = resolverEstadoExibicao(categoria.regras, agora)
  if (!estadoCategoria.disponivel || categoria.itens.length === 0) return null

  const catalogo = cardapio.formato_exibicao === 'catalogo'

  return (
    // scroll-mt compensa o cabeçalho fixo (sticky) da página — sem isso o
    // título da categoria fica escondido atrás dele ao pular pra cá pelo
    // menu ☰ (NavegacaoCategoriasV2.tsx).
    <section id={`cat-${categoria.id}`} className="mb-6 scroll-mt-20">
      <h2 className="mb-2 text-base font-bold" style={{ color: cardapio.cor_primaria }}>{categoria.nome}</h2>
      <div className={catalogo ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-2'}>
        {categoria.itens.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            canal={canal}
            alergenos={alergenos}
            cardapio={cardapio}
            agora={agora}
            gruposComplemento={gruposComplemento}
            carrinhoAtivo={carrinhoAtivo}
          />
        ))}
      </div>
    </section>
  )
}
