import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Esta rota foi unificada com /gerenciar — antes existiam duas telas
 * diferentes editando o mesmo estabelecimento (/editar e /gerenciar),
 * o que causava confusão (edições em uma não refletiam claramente na
 * outra, e só o dono tinha acesso aqui). Agora /gerenciar cobre tudo,
 * para dono e para a equipe, com abas adequadas a cada papel.
 */
export default async function EditarEstabelecimentoRedirectPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/painel/estabelecimento/${id}/gerenciar`)
}
