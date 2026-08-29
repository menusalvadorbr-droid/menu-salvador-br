/**
 * Tokens compartilhados pelos componentes "duas peles" do fluxo de
 * pedidos — claro por padrão (mapa de mesas, /pedidos), escuro quando
 * abertos de dentro da área de Caixa (tema="escuro", visual de PDV
 * isolado do resto do painel, ver caixaTema.ts). LancarPedidoGarcom.tsx,
 * FecharContaMesaModal.tsx e SeletorFormaPagamento.tsx tinham a mesma
 * paleta claro/escuro copiada campo por campo pros elementos que os três
 * compartilham — cada arquivo estende isto com suas próprias chaves
 * extras (específicas do que só ele renderiza).
 */
export const TEMA_DUAS_PELES = {
  claro: {
    modal: 'bg-white',
    borda: 'border-neutral-100',
    titulo: 'text-neutral-900',
    fechar: 'text-neutral-400 hover:text-neutral-600',
    vazio: 'text-neutral-400',
    label: 'text-neutral-600',
    input: 'border-neutral-200 bg-white text-neutral-900',
    separador: 'bg-neutral-100',
    separadorTexto: 'text-neutral-400',
  },
  escuro: {
    modal: 'bg-neutral-900',
    borda: 'border-neutral-800',
    titulo: 'text-white',
    fechar: 'text-neutral-500 hover:text-neutral-300',
    vazio: 'text-neutral-500',
    label: 'text-neutral-400',
    input: 'border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-500',
    separador: 'bg-neutral-800',
    separadorTexto: 'text-neutral-500',
  },
} as const
