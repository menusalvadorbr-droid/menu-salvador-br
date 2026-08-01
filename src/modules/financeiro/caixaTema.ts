/**
 * Tokens de estilo da área de caixa — visual escuro tipo terminal de PDV
 * profissional, deliberadamente desacoplado da identidade de marca usada
 * no resto do painel e no cardápio público (pedido explícito: essa tela
 * não precisa combinar com o resto do produto). Centralizado aqui pra
 * manter a mesma paleta em todos os arquivos da área — PainelCaixa,
 * HistoricoCaixa, MesasComContaAberta, DemonstrativoSessaoCaixa, e o
 * LancarPedidoGarcom/FecharContaMesaModal quando abertos a partir daqui
 * (tema="escuro") — sem repetir a mesma string de classes em cada um.
 */
export const caixaTema = {
  pagina: 'bg-neutral-950 text-neutral-100',
  painel: 'rounded-xl border border-neutral-800 bg-neutral-900',
  painelDestaque: 'rounded-xl border border-neutral-700 bg-neutral-800/60',
  divisor: 'border-neutral-800',
  linhaHover: 'hover:bg-neutral-800/60',

  textoSecundario: 'text-neutral-400',
  textoTerciario: 'text-neutral-500',

  botaoVerde:
    'bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40 disabled:hover:bg-emerald-600',
  botaoVermelho:
    'bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-40 disabled:hover:bg-red-600',
  botaoNeutro:
    'border border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition disabled:opacity-40',

  badgeSucesso: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  badgeAlerta: 'border border-amber-500/30 bg-amber-500/10 text-amber-400',
  badgeInfo: 'border border-sky-500/30 bg-sky-500/10 text-sky-400',

  input:
    'rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50',

  skeleton: 'animate-pulse rounded-lg bg-neutral-800/80',
}
