export interface SecaoConfig {
  chave: string
  ativa: boolean
  ordem: number
}

// Mesma fonte usada em /admin/configuracoes pra controlar o que aparece
// na página pública do estabelecimento — igual pra todos.
export const SECOES_PADRAO: SecaoConfig[] = [
  { chave: 'capa', ativa: true, ordem: 0 },
  { chave: 'sobre', ativa: true, ordem: 1 },
  { chave: 'cardapio_destaque', ativa: true, ordem: 2 },
  { chave: 'galeria', ativa: true, ordem: 3 },
  { chave: 'horarios', ativa: true, ordem: 4 },
  { chave: 'localizacao', ativa: true, ordem: 5 },
  { chave: 'comodidades', ativa: true, ordem: 6 },
  { chave: 'avaliacoes_google', ativa: false, ordem: 7 },
  { chave: 'contato', ativa: true, ordem: 8 },
  { chave: 'promocoes', ativa: true, ordem: 9 },
]

/** A partir do `value` bruto salvo em platform_settings (ou null, se
 *  nunca configurado) — devolve o teste de "essa seção está ligada?" e a
 *  ordem final de exibição, já resolvidos. */
export function resolverSecoesEstabelecimento(configSalva: unknown): {
  secaoAtiva: (chave: string) => boolean
  ordemSecoes: string[]
} {
  const secoesConfig = (configSalva as SecaoConfig[] | null) || SECOES_PADRAO
  const secaoAtiva = (chave: string) => secoesConfig.find((s) => s.chave === chave)?.ativa ?? false
  const ordemSecoes = [...secoesConfig].sort((a, b) => a.ordem - b.ordem).map((s) => s.chave)
  return { secaoAtiva, ordemSecoes }
}
