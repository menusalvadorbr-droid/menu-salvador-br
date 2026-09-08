import { TEMA_DUAS_PELES } from '../temaDuasPeles'

// Mesmo princípio do FecharContaMesaModal: claro é o único tema em uso
// hoje (mapa de mesas, "Venda no balcão" em /pedidos, e também o Caixa
// desde que sua paleta foi unificada com o resto do painel) — `escuro`
// segue existindo como opção reutilizável, sem consumidor no momento.
export const ESTILOS_GARCOM = {
  claro: {
    ...TEMA_DUAS_PELES.claro,
    fundoCardapio: 'bg-neutral-100',
    categoria: 'text-neutral-400',
    itemBotao: 'border-neutral-100 hover:border-orange-200 hover:bg-orange-50',
    itemNome: 'text-neutral-800',
    itemPreco: 'text-neutral-900',
    sacolaTexto: 'text-neutral-700',
    qtdBotao: 'border-neutral-200 text-neutral-500',
    total: 'text-neutral-900',
    botaoPrincipal: 'bg-orange-600 hover:bg-orange-700 text-white',
    botaoToggleAtivo: 'bg-orange-600 text-white',
    destaque: 'bg-orange-50',
  },
  escuro: {
    ...TEMA_DUAS_PELES.escuro,
    fundoCardapio: 'bg-neutral-950/40',
    categoria: 'text-neutral-500',
    itemBotao: 'border-neutral-800 hover:border-emerald-500/40 hover:bg-emerald-500/10',
    itemNome: 'text-neutral-200',
    itemPreco: 'text-white',
    sacolaTexto: 'text-neutral-300',
    qtdBotao: 'border-neutral-700 text-neutral-400',
    total: 'text-white',
    botaoPrincipal: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    botaoToggleAtivo: 'bg-emerald-600 text-white',
    destaque: 'bg-emerald-500/10',
  },
} as const

export type EstilosGarcom = (typeof ESTILOS_GARCOM)[keyof typeof ESTILOS_GARCOM]
