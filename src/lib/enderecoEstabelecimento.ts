export function montarEnderecoCompleto(
  est: { endereco: string | null; tipo_logradouro: string | null; numero: string | null },
  nomeBairro: string | null,
  nomeCidade: string
): string {
  return est.endereco
    ? `${[est.tipo_logradouro, est.endereco].filter(Boolean).join(' ')}${est.numero ? ', ' + est.numero : ''}${nomeBairro ? `, ${nomeBairro}` : ''}, ${nomeCidade}, BA`
    : `${nomeBairro ? `${nomeBairro}, ` : ''}${nomeCidade}, BA`
}

/**
 * O admin pode preencher um link de Google Maps manualmente — ele tem
 * prevalência sobre o endereço geocodificado. `mapUrl` (embed) só aceita
 * o link customizado se for do tipo "Compartilhar → Incorporar um mapa"
 * (contém "/maps/embed"); um link comum de "Compartilhar local" não é
 * aceito pelo Google dentro de iframe, então nesse caso o embed cai de
 * volta pro endereço geocodificado — mas `linkAbrirMapa` (fora do
 * iframe, botão "Abrir no Google Maps") sempre usa o link customizado
 * quando existe, incorporável ou não, senão esse tipo de link ficaria
 * sem nenhum efeito na página pública mesmo preenchido.
 */
export function resolverLinksMapa(
  est: { link_google_maps: string | null; latitude: number | null; longitude: number | null },
  enderecoCompleto: string
): { mapUrl: string; linkAbrirMapa: string } {
  const linkCustomizado = est.link_google_maps?.trim() || null
  const linkCustomizadoEhEmbed = !!linkCustomizado && linkCustomizado.includes('/maps/embed')

  const mapUrl = linkCustomizadoEhEmbed
    ? linkCustomizado
    : est.latitude && est.longitude
    ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`

  const linkAbrirMapa =
    linkCustomizado ||
    (est.latitude && est.longitude
      ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16`
      : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}`)

  return { mapUrl, linkAbrirMapa }
}

export const ETIQUETA_ESTACIONAMENTO: Record<string, { emoji: string; chave: string; texto: string }> = {
  proprio: { emoji: '🅿️', chave: 'estacionamento_proprio', texto: 'Estacionamento próprio' },
  valet: { emoji: '🚗', chave: 'estacionamento_manobrista', texto: 'Manobrista' },
  rua: { emoji: '🅿️', chave: 'estacionamento_rua', texto: 'Estacionamento na rua' },
  nao_tem: { emoji: '🚫', chave: 'estacionamento_sem', texto: 'Sem estacionamento' },
}

export function temComodidade(est: {
  aceita_pets: boolean | null
  estacionamento: string | null
  acessibilidade: string[] | null
}): boolean {
  return Boolean(est.aceita_pets || est.estacionamento || (est.acessibilidade && est.acessibilidade.length > 0))
}
