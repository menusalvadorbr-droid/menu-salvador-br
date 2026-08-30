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

/** "5573994333728" → "+55 (73) 99433-3728" — telefone de cliente pra
 *  exibição (Fila do Operador, Conversas). Se não bater no formato
 *  esperado (DDI 55 + DDD + 8/9 dígitos), devolve os dígitos como vieram
 *  em vez de arriscar cortar errado — mesmo espírito defensivo de
 *  normalizarTelefone, o dado pode ter entrado torto no banco. */
export function formatarTelefoneExibicao(telefone: string): string {
  const digitos = (telefone || '').replace(/\D/g, '')
  const semDDI = digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)
    ? digitos.slice(2)
    : digitos

  const ddd = semDDI.slice(0, 2)
  const numero = semDDI.slice(2)
  if (ddd.length !== 2 || (numero.length !== 8 && numero.length !== 9)) return digitos || telefone

  const parteFinal = numero.length === 9 ? `${numero.slice(0, 5)}-${numero.slice(5)}` : `${numero.slice(0, 4)}-${numero.slice(4)}`
  return `+55 (${ddd}) ${parteFinal}`
}
