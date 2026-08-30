import { redirect } from 'next/navigation'

/** "Conversas" foi absorvida pela Central do Operador (/operador) — a
 *  mesma lista de conversas de WhatsApp que vivia aqui (ConversasInbox)
 *  agora é parte da lista mestre única de lá, junto com Pix/Validação.
 *  Mantido como redirect (em vez de excluído) pra não quebrar links e
 *  favoritos antigos que ainda apontem pra /conversas. */
export default async function ConversasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/painel/estabelecimento/${id}/operador`)
}
