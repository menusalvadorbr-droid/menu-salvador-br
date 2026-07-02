import SecaoPromocoes from './secoes/Promocoes'
import SecaoEstabelecimentos from './secoes/Estabelecimentos'
import SecaoDestaques from './secoes/Destaques'
import SecaoPropaganda from './secoes/Propaganda'
import SecaoCulinarias from './secoes/Culinarias'

export default function SecaoPublicaBairro({
  tipo,
  bairroId,
}: {
  tipo: string
  bairroId: string
}) {
  switch (tipo) {
    case 'promocoes':
      return <SecaoPromocoes bairroId={bairroId} />

    case 'estabelecimentos':
      return <SecaoEstabelecimentos bairroId={bairroId} />

    case 'destaques':
      return <SecaoDestaques bairroId={bairroId} />

    case 'propaganda':
      return <SecaoPropaganda bairroId={bairroId} />

    case 'culinarias':
      return <SecaoCulinarias bairroId={bairroId} />

    default:
      return null
  }
}
