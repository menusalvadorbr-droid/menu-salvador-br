import { getPromocoesAtivas } from './getPromocoesAtivas'
import { PromocoesCarrossel } from './PromocoesCarrossel'

/** Busca própria, independente do resto da home — PromocoesCarrossel já
 *  cuidava só da parte interativa (scroll/autoplay), a busca vivia
 *  centralizada no Promise.all antigo de HomePage(). */
export default async function PromocoesSecao() {
  const promocoes = await getPromocoesAtivas()
  return <PromocoesCarrossel itens={promocoes} />
}
