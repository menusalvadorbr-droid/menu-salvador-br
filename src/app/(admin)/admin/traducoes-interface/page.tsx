import { createClient } from '@/lib/supabase/server'
import TraducoesInterfaceForm from './TraducoesInterfaceForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

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
      <AdminPageHeader
        titulo="Traduções da interface"
        descricao="Textos fixos que aparecem em qualquer cardápio público (dias da semana, rótulos, botões) — traduzidos uma vez aqui, valem para todos os estabelecimentos. Campo vazio usa o texto em português como padrão."
      />

      <TraducoesInterfaceForm valoresIniciais={valoresIniciais} />
    </div>
  )
}
