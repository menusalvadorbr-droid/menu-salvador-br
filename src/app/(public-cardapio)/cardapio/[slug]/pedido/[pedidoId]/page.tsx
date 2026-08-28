import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/publicServer'
import AcompanharPedido from './AcompanharPedido'

// Página do cliente, fora do cardápio principal (mesmo motivo de
// cookies()/ISR já resolvido lá — createPublicClient, sem sessão). O
// carregamento e a atualização em tempo real do status ficam por conta do
// AcompanharPedido (client component) — aqui só confirma que o slug existe
// pra montar o cabeçalho e o link "Voltar ao cardápio".
export default async function AcompanharPedidoPage({
  params,
}: {
  params: Promise<{ slug: string; pedidoId: string }>
}) {
  const { slug, pedidoId } = await params
  const supabase = createPublicClient()

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('nome, nome_fantasia, chave_pix, cidades(nome)')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .limit(1)
    .single()
  if (!est) notFound()

  const nomeEstabelecimento = est.nome_fantasia || est.nome
  const cidades = est.cidades as { nome: string }[] | { nome: string } | null
  const cidadeNome = (Array.isArray(cidades) ? cidades[0]?.nome : cidades?.nome) || null

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <AcompanharPedido
        slug={slug}
        pedidoId={pedidoId}
        nomeEstabelecimento={nomeEstabelecimento}
        chavePix={est.chave_pix}
        cidade={cidadeNome}
      />
    </div>
  )
}
