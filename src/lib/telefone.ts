// src/lib/telefone.ts
//
// Normaliza telefone de cliente pro mesmo formato que
// whatsapp_conversas.telefone já usa (dígitos + DDI 55, sem "+"/espaço/
// traço) — mesmo formato que o webhook da Meta manda cru, pra qualquer
// cruzamento entre orders.telefone e whatsapp_conversas.telefone (ou link
// de wa.me) funcionar sem conversão a mais.

export function normalizarTelefone(bruto: string): string {
  const digitos = (bruto || '').replace(/\D/g, '')
  if (!digitos) return ''

  // Já tem DDI 55 (12 dígitos = DDD+8, 13 = DDD+9): mantém como está.
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    return digitos
  }
  // DDD + número, sem DDI: prefixa 55.
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`
  }
  // Formato inesperado — devolve os dígitos como estão em vez de lançar
  // exceção. O checkout não pode travar por causa de telefone mal digitado;
  // o campo é texto livre no banco, sem constraint de formato.
  return digitos
}

/** Assume telefone já normalizado (com DDI). Não usar pro número da PRÓPRIA
 *  loja (whatsappEstabelecimento) — esse é guardado sem o "55" e já tem seu
 *  próprio link em useFinalizarPedido.ts. */
export function telefoneParaWhatsApp(telefone: string): string {
  return `https://wa.me/${telefone}`
}
