import { createClient } from '@/lib/supabase/server'
import TraducoesInterfaceForm from './TraducoesInterfaceForm'

export default async function TraducoesInterfaceAdminPage() {
  const supabase = await createClient()
  const { data: linhas } = await supabase
    .from('traducoes_interface')
    .select('chave, idioma, valor')

  const valoresIniciais: Record<string, { en: string; fr: string; es: string }> = {}
  for (const linha of (linhas || []) as { chave: string; idioma: string; valor: string }[]) {
    if (!valoresIniciais[linha.chave]) valoresIniciais[linha.chave] = { en: '', fr: '', es: '' }
    const idioma = linha.idioma
    if (idioma === 'en' || idioma === 'fr' || idioma === 'es') {
      valoresIniciais[linha.chave][idioma] = linha.valor
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Traduções da interface</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Textos fixos que aparecem em qualquer cardápio público (dias da semana, rótulos, botões) —
          traduzidos uma vez aqui, valem para todos os estabelecimentos. Campo vazio usa o texto em
          português como padrão.
        </p>
      </div>

      <TraducoesInterfaceForm valoresIniciais={valoresIniciais} />
    </div>
  )
}
