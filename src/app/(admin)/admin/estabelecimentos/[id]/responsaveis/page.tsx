import { redirect } from 'next/navigation'

// Essa tela virou parte de /analisar (junto com /editar). Isso aqui só
// existe pra não quebrar link salvo/indexado que ainda aponte pra cá.
export default async function ResponsaveisEstabelecimentoRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/estabelecimentos/${id}/analisar`)
}
