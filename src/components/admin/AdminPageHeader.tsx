/**
 * Cabeçalho padrão de toda página do admin — antes cada página repetia
 * seu próprio bloco de <h1>/<p>, com pequenas divergências de espaçamento
 * e cor (gray vs neutral) que iam se acumulando. `acoes` é pra botão(ões)
 * que ficam ao lado do título (ex: "+ Adicionar estabelecimento").
 */
export default function AdminPageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao?: React.ReactNode
  acoes?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-neutral-500">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-shrink-0 items-center gap-2">{acoes}</div>}
    </div>
  )
}
