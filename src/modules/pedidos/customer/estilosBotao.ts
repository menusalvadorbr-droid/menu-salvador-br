// Botões do fluxo de pedido do cliente (SacolaDrawer, FinalizarPedidoModal,
// página de acompanhamento) reaproveitam as mesmas duas variantes — antes
// cada arquivo tinha sua própria combinação parecida-mas-diferente de
// rounded/padding/cor (ex: "Confirmar pedido" verde vs "Fechar" laranja no
// mesmo modal, uma dupla que deveria ler como primária+secundária).
// Laranja pra bater com o resto do carrinho (botão flutuante, "Acompanhar
// meu pedido") e com o destaque usado no app inteiro — verde fica reservado
// pra ação de pagamento/fechar conta (PainelComandas), não faz sentido
// nesse fluxo já que nenhum desses botões fecha pagamento.
// Sem largura fixa — cada tela decide `w-full` (empilhado) ou `flex-1`
// (lado a lado) de acordo com o layout ao redor.
export const BOTAO_PEDIDO_PRIMARIO =
  'block rounded-lg bg-orange-600 py-2.5 text-center font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50'

export const BOTAO_PEDIDO_SECUNDARIO =
  'block rounded-lg border border-neutral-200 py-2.5 text-center font-semibold text-neutral-700 transition hover:bg-neutral-50'
