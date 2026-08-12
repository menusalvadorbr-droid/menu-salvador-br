// Normalização única de slug — usada tanto pro front (TypeScript) quanto
// espelhada em SQL (public.gerar_slug, ver migração
// 20260807_slugs_canonicos.sql). As duas implementações devem produzir a
// mesma saída pros mesmos casos de teste; qualquer mudança aqui precisa
// da mudança equivalente lá.
//
// 1. Normaliza Unicode NFD e remove diacríticos
// 2. Minúsculas
// 3. Remove apóstrofos (reto, curvo, crase) sem substituir
// 4. "&" -> "-e-"
// 5. Qualquer sequência fora de [a-z0-9] -> "-"
// 6. Remove hífens das pontas
// Faixa Unicode das marcas de acentuação combinantes (U+0300-U+036F) —
// é isso que sobra dos caracteres acentuados depois do normalize('NFD').
const MARCAS_DIACRITICAS = /[̀-ͯ]/g

export function gerarSlug(texto: string): string {
  let s = texto.normalize('NFD').replace(MARCAS_DIACRITICAS, '')
  s = s.toLowerCase()
  s = s.replace(/['’`]/g, '')
  s = s.replace(/&/g, '-e-')
  s = s.replace(/[^a-z0-9]+/g, '-')
  s = s.replace(/^-+|-+$/g, '')
  return s
}
