import { Loader2, ShieldX, SearchX } from 'lucide-react'

interface EstadoCarregamentoProps {
  acessoNegado: boolean
  loading: boolean
  encontrado: boolean
}

/**
 * Os três estados de carregamento/acesso são idênticos nas telas de
 * gerenciar (início, cardápio, configurações, gestão) — extraído aqui pra
 * não repetir. Retorna `null` quando está tudo certo pra a página seguir
 * com o conteúdo de verdade.
 */
export default function EstadoCarregamento({ acessoNegado, loading, encontrado }: EstadoCarregamentoProps) {
  if (acessoNegado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldX className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-neutral-700">Você não tem acesso a este estabelecimento.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!encontrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <SearchX className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-neutral-700">Estabelecimento não encontrado.</p>
        </div>
      </div>
    )
  }

  return null
}
