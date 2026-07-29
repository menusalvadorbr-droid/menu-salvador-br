// Formato já resolvido (nomes prontos pra exibir, não o formato cru do
// Postgrest) usado pelo seletor de item — tanto pra variações de tamanho
// quanto pra grupos de complementos, incluindo os grupos condicionalmente
// liberados por uma opção específica (opcao_grupo_complemento).

export interface VariacaoResolvida {
  id: string
  nome: string
  preco: number
}

export interface OpcaoResolvida {
  id: string
  nome: string
  precoAdicional: number
  exibirPreco: boolean
  gruposExtras: GrupoResolvido[]
}

export interface GrupoResolvido {
  id: string
  nome: string
  selecaoMinima: number
  selecaoMaxima: number
  opcoes: OpcaoResolvida[]
}
