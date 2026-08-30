/**
 * Tokens de estilo da área de caixa — paleta unificada com o resto do
 * painel (mesma base que a Central do Operador usa: fundo neutral-50,
 * cards brancos, amber/sky/neutral para os estados). Antes esta área era
 * deliberadamente escura ("terminal de PDV" desacoplado do resto do
 * produto); a decisão foi revertida — agora combina com o resto do
 * painel. Centralizado aqui pra manter a mesma paleta em todos os
 * arquivos da área — PainelCaixa, HistoricoCaixa, MesasComContaAberta,
 * DemonstrativoSessaoCaixa, e o LancarPedidoGarcom/FecharContaMesaModal
 * quando abertos a partir daqui — sem repetir a mesma string de classes
 * em cada um.
 *
 * Camadas pra manter as áreas da tela distinguíveis mesmo tudo claro:
 * fundo da página (neutral-50) → cards (branco, borda + sombra) →
 * superfícies internas/destacadas dentro de um card (neutral-50 ou tom
 * colorido claro) — mesma hierarquia de 3 níveis que a Central do
 * Operador já usa (página → lista/detalhe → item).
 */
export const caixaTema = {
  pagina: 'bg-neutral-50 text-neutral-900',
  painel: 'rounded-2xl border border-neutral-100 bg-white shadow-sm',
  painelDestaque: 'rounded-xl border border-neutral-200 bg-neutral-50',
  divisor: 'border-neutral-100',
  linhaHover: 'hover:bg-neutral-50',

  textoSecundario: 'text-neutral-600',
  textoTerciario: 'text-neutral-500',

  botaoVerde:
    'bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-40 disabled:hover:bg-emerald-600',
  botaoVermelho:
    'bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-40 disabled:hover:bg-red-600',
  botaoNeutro:
    'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40',

  badgeSucesso: 'bg-green-100 text-green-700',
  badgeAlerta: 'bg-amber-100 text-amber-800',
  badgeInfo: 'bg-sky-100 text-sky-800',

  input:
    'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300',

  skeleton: 'animate-pulse rounded-lg bg-neutral-200',
}
