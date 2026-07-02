import { redirect } from "next/navigation"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Redireciona direto para o Cardápio
  redirect(`/painel/estabelecimento/${id}/editar/cardapio`)
}
