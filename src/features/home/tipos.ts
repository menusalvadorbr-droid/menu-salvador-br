import type { EstablishmentCardData } from '@/components/public/EstablishmentCard'

/** Formato retornado por `.select('*, bairros(nome, slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')`
 *  — usado por GridGeralSecao/GridClient/RecomendadosSecao pra montar o
 *  href de cada card sem precisar de `any`. */
export interface EstabelecimentoComJoins extends EstablishmentCardData {
  id: string
  slug: string
  cidade: string | null
  tipo_estabelecimento: string | null
  bairros: { nome: string; slug: string } | null
}

export interface VinculoCulinaria {
  estabelecimento_id: string
}
