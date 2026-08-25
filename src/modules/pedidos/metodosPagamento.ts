// Extraído de SeletorFormaPagamento.tsx ('use client') pra poder ser
// importado por código server-only (buildCardapioContext.ts, usado no
// processamento do webhook do WhatsApp) sem cruzar a fronteira de client
// boundary do Next. Único lugar que define esses métodos — plataforma
// inteira, não configurável por estabelecimento hoje (ver comentário em
// buildCardapioContext.ts).
export const METODOS_PAGAMENTO = ['Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Pix'] as const
