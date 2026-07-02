import SecaoPromocoes from './secoes/Promocoes'
import SecaoDestaques from './secoes/Destaques'
import SecaoBairros from './secoes/Bairros'
import SecaoCulinarias from './secoes/Culinarias'
import SecaoPropaganda from './secoes/Propaganda'
import SecaoEstabelecimentosPopulares from './secoes/EstabelecimentosPopulares'

export default function SecaoPublicaCidade({
  tipo,
  cidadeId,
}: {
  tipo: string
  cidadeId: string
}) {
  switch (tipo) {
    case 'promocoes':
      return <SecaoPromocoes cidadeId={cidadeId} />

    case 'destaques':
      return <SecaoDestaques cidadeId={cidadeId} />

    case 'bairros':
      return <SecaoBairros cidadeId={cidadeId} />

    case 'culinarias':
      return <SecaoCulinarias cidadeId={cidadeId} />

    case 'propaganda':
      return <SecaoPropaganda cidadeId={cidadeId} />

    case 'estabelecimentos_populares':
      return <SecaoEstabelecimentosPopulares cidadeId={cidadeId} />

    default:
      return null
  }
}
