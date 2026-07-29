interface EstadoCarregamentoProps {
  acessoNegado: boolean
  loading: boolean
  encontrado: boolean
}

/**
 * Os três estados de carregamento/acesso são idênticos nas três telas
 * dessa área (início, cardápio, gestão) — extraído aqui pra não repetir.
 * Retorna `null` quando está tudo certo pra a página seguir com o
 * conteúdo de verdade.
 */
export default function EstadoCarregamento({ acessoNegado, loading, encontrado }: EstadoCarregamentoProps) {
  if (acessoNegado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-red-600">
        Você não tem acesso a este estabelecimento.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        Carregando...
      </div>
    )
  }

  if (!encontrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-red-600">
        Estabelecimento não encontrado.
      </div>
    )
  }

  return null
}
