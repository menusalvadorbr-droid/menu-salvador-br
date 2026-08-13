// src/lib/brasilapi.ts
//
// Cliente server-side da BrasilAPI (https://brasilapi.com.br) para
// consulta de dados públicos de CNPJ. É uma API pública mantida pela
// comunidade — não precisa de conta nem token. Endpoint confirmado:
// GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
//
// Ainda assim, chamar de um Server Component/Server Action (nunca do
// Client Component) e nunca em resposta a cada tecla digitada — só
// quando o usuário clicar em "Buscar", pra não sobrecarregar a API
// pública com requisições repetidas.

export interface DadosCnpj {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  telefone: string | null
  email: string | null
  endereco: string | null
  // Campos separados do endereço — a BrasilAPI já devolve assim, mas
  // antes eram só concatenados dentro de `endereco`. Expostos separados
  // pra formulário poder editar/exibir cada pedaço (ex: bairro casando
  // com a tabela oficial de bairros, tipo de logradouro em campo próprio).
  tipoLogradouro: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cep: string | null
  cidade: string | null
  uf: string | null
  // Atividade econômica (CNAE) — usada também pro admin geral montar
  // métricas de estabelecimentos por segmento.
  atividadeEconomica: string | null
  cnaeCodigo: string | null
}

export interface SocioCnpj {
  nome: string
  cpfMascarado: string | null
  qualificacao: string | null
  dataEntradaSociedade: string | null
  faixaEtaria: string | null
}

// A Receita Federal devolve nomes/endereços em CAIXA ALTA. Deixo em
// Title Case (cada palavra com inicial maiúscula), que fica mais
// legível pra nome de empresa/rua do que tudo em minúsculo puro —
// exceto preposições comuns em português, que ficam minúsculas mesmo
// no meio da frase ("Vitória da Conquista", não "Vitória Da
// Conquista"). Primeira palavra sempre maiúscula, mesmo se for uma
// dessas (nome não deveria começar com preposição, mas por garantia).
const PREPOSICOES_MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

function capitalizarNome(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .split(' ')
    .map((palavra, indice) => {
      if (!palavra) return palavra
      if (indice > 0 && PREPOSICOES_MINUSCULAS.has(palavra)) return palavra
      return palavra[0].toUpperCase() + palavra.slice(1)
    })
    .join(' ')
}

export interface DadosCnpjCompleto extends DadosCnpj {
  dataAbertura: string | null
  opcaoPeloSimples: boolean | null
  dataOpcaoPeloSimples: string | null
  socios: SocioCnpj[]
}

// Consulta estendida — só deve ser chamada em fluxos administrativos
// (ex: admin cadastrando um estabelecimento pro diretório antes de
// alguém reivindicar). Traz dados extras que ajudam a validar uma
// reivindicação depois: quadro de sócios, situação do Simples Nacional,
// tipo de logradouro e data de abertura da empresa.
//
// ⚠️ Mesmo aviso da consultarCnpj(): os nomes de campo de `qsa` (quadro
// de sócios) foram montados com base em exemplos públicos e podem
// precisar de ajuste fino contra uma resposta real — confira o
// console.warn no log do servidor se `socios` vier vazio para um CNPJ
// que sabidamente tem sócios cadastrados.
export async function consultarCnpjCompleto(cnpjLimpo: string): Promise<DadosCnpjCompleto> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; MenuSalvadorBot/1.0)',
    },
    next: { revalidate: 60 * 60 },
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.')
    if (res.status === 403) {
      throw new Error('A BrasilAPI recusou a consulta (403) — tente novamente em alguns segundos.')
    }
    throw new Error(`Erro ao consultar CNPJ (status ${res.status}).`)
  }

  const dados = await res.json()

  const enderecoPartes = [
    dados.logradouro,
    dados.numero && `nº ${dados.numero}`,
    dados.complemento,
    dados.bairro,
  ].filter(Boolean)

  const socios: SocioCnpj[] = Array.isArray(dados.qsa)
    ? dados.qsa.map((socio: any) => ({
        nome: socio.nome_socio || socio.nome || '',
        cpfMascarado: socio.cnpj_cpf_do_socio || socio.cpf_socio || null,
        qualificacao: socio.qualificacao_socio || socio.descricao_qualificacao_socio || null,
        dataEntradaSociedade: socio.data_entrada_sociedade || null,
        faixaEtaria: socio.descricao_faixa_etaria || socio.faixa_etaria || null,
      }))
    : []

  if (Array.isArray(dados.qsa) && dados.qsa.length > 0 && socios.every((s) => !s.nome)) {
    console.warn(
      '[brasilapi] O array qsa veio preenchido mas nenhum campo de nome foi reconhecido. ' +
      'Confira os nomes de campo reais e ajuste consultarCnpjCompleto() em src/lib/brasilapi.ts. QSA bruto:',
      JSON.stringify(dados.qsa).slice(0, 2000)
    )
  }

  return {
    cnpj: cnpjLimpo,
    razaoSocial: capitalizarNome(dados.razao_social),
    nomeFantasia: capitalizarNome(dados.nome_fantasia),
    situacaoCadastral: dados.descricao_situacao_cadastral || '',
    telefone: dados.ddd_telefone_1 || null,
    email: dados.email || null,
    endereco: enderecoPartes.length > 0 ? enderecoPartes.join(', ') : null,
    logradouro: dados.logradouro ? capitalizarNome(dados.logradouro) : null,
    numero: dados.numero || null,
    complemento: dados.complemento ? capitalizarNome(dados.complemento) : null,
    bairro: dados.bairro ? capitalizarNome(dados.bairro) : null,
    cep: dados.cep || null,
    cidade: dados.municipio ? capitalizarNome(dados.municipio) : null,
    uf: dados.uf || null,
    atividadeEconomica: dados.cnae_fiscal_descricao || null,
    cnaeCodigo: dados.cnae_fiscal ? String(dados.cnae_fiscal) : null,
    tipoLogradouro: dados.descricao_tipo_de_logradouro ? capitalizarNome(dados.descricao_tipo_de_logradouro) : null,
    dataAbertura: dados.data_inicio_atividade || null,
    opcaoPeloSimples: typeof dados.opcao_pelo_simples === 'boolean' ? dados.opcao_pelo_simples : null,
    dataOpcaoPeloSimples: dados.data_opcao_pelo_simples || null,
    socios,
  }
}
export async function consultarCnpj(cnpjLimpo: string): Promise<DadosCnpj> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
    headers: {
      Accept: 'application/json',
      // Sem um User-Agent parecido com navegador, a proteção da Cloudflare
      // na frente da BrasilAPI responde 403 mesmo com a URL certa.
      'User-Agent': 'Mozilla/5.0 (compatible; MenuSalvadorBot/1.0)',
    },
    // CNPJ raramente muda de dados de um dia pro outro — cache curto
    // evita bater na API de novo se o usuário clicar "Buscar" mais de
    // uma vez pelo mesmo CNPJ na mesma janela de tempo.
    next: { revalidate: 60 * 60 },
  })

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('CNPJ não encontrado na Receita Federal.')
    }
    if (res.status === 403) {
      throw new Error(
        'A BrasilAPI recusou a consulta (403) — pode ser bloqueio temporário de acesso. Tente novamente em alguns segundos ou use o preenchimento manual.'
      )
    }
    throw new Error(`Erro ao consultar CNPJ (status ${res.status}).`)
  }

  const dados = await res.json()

  const enderecoPartes = [
    dados.logradouro,
    dados.numero && `nº ${dados.numero}`,
    dados.complemento,
    dados.bairro,
  ].filter(Boolean)

  return {
    cnpj: cnpjLimpo,
    razaoSocial: capitalizarNome(dados.razao_social),
    nomeFantasia: capitalizarNome(dados.nome_fantasia),
    situacaoCadastral: dados.descricao_situacao_cadastral || '',
    telefone: dados.ddd_telefone_1 || null,
    email: dados.email || null,
    endereco: enderecoPartes.length > 0 ? enderecoPartes.join(', ') : null,
    tipoLogradouro: dados.descricao_tipo_de_logradouro ? capitalizarNome(dados.descricao_tipo_de_logradouro) : null,
    logradouro: dados.logradouro ? capitalizarNome(dados.logradouro) : null,
    numero: dados.numero || null,
    complemento: dados.complemento ? capitalizarNome(dados.complemento) : null,
    bairro: dados.bairro ? capitalizarNome(dados.bairro) : null,
    cep: dados.cep || null,
    cidade: dados.municipio ? capitalizarNome(dados.municipio) : null,
    uf: dados.uf || null,
    atividadeEconomica: dados.cnae_fiscal_descricao || null,
    cnaeCodigo: dados.cnae_fiscal ? String(dados.cnae_fiscal) : null,
  }
}
