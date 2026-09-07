import EditorPerfilEspelho from './EditorPerfilEspelho'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Espelho clicável do perfil público — ver plano "Editor de Perfil V1".
 * Substitui o antigo redirect pra /gerenciar (que existia porque duas
 * telas editando o mesmo estabelecimento causavam confusão): agora esta
 * rota passa a ser a única tela de edição de perfil, então o motivo do
 * redirect deixou de existir.
 */
export default function EditarEstabelecimentoPage({ params }: PageProps) {
  return <EditorPerfilEspelho params={params} />
}
