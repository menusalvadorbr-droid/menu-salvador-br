// src/lib/apibrasil.ts
//
// Cliente server-side da API Brasil (gateway.apibrasil.io) para consulta
// de dados públicos de CNPJ. NUNCA importar isso em um Client Component —
// as credenciais (Bearer + DeviceToken) só existem no servidor.
//
// Credenciais: gerar conta em https://apibrasil.com.br, ativar a API
// "Dados CNPJ Receita" em "Minhas APIs" e copiar o Bearer Token e o
// Device Token pra variáveis de ambiente:
//   APIBRASIL_BEARER_TOKEN=
//   APIBRASIL_DEVICE_TOKEN=
//
// ⚠️ Aviso importante: o formato exato da resposta (nomes de campo) foi
// montado com base na documentação pública e em SDKs oficiais da
// APIBrasil, mas não foi testado contra uma chamada real (esse ambiente
// não tem acesso à internet para chamar a API de verdade). A função
// abaixo tenta várias variações de nome de campo prováveis e loga um
// aviso se não encontrar os campos esperados — ao configurar as
// credenciais reais, rode uma consulta de teste e confira o `console.warn`
// no log do servidor; se algum campo vier vazio mesmo com a API
// respondendo, é provável que só falte ajustar o nome do campo aqui.

export interface DadosCnpj {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  telefone: string | null
  email: string | null
  endereco: string | null
  cep: string | null
  cidade: string | null
  uf: string | null
}

function primeiroValor(obj: any, chaves: string[]): string | null {
  for (const chave of chaves) {
    const valor = obj?.[chave]
    if (valor !== undefined && valor !== null && valor !== '') return String(valor)
  }
  return null
}

export async function consultarCnpj(cnpjLimpo: string): Promise<DadosCnpj> {
  const bearerToken = process.env.APIBRASIL_BEARER_TOKEN
  const deviceToken = process.env.APIBRASIL_DEVICE_TOKEN

  if (!bearerToken || !deviceToken) {
    throw new Error(
      'Consulta de CNPJ não configurada: faltam APIBRASIL_BEARER_TOKEN / APIBRASIL_DEVICE_TOKEN no .env.'
    )
  }

  const res = await fetch('https://gateway.apibrasil.io/api/v2/dados/cnpj', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearerToken}`,
      DeviceToken: deviceToken,
    },
    body: JSON.stringify({ cnpj: cnpjLimpo }),
  })

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('CNPJ não encontrado na Receita Federal.')
    }
    throw new Error(`Erro ao consultar CNPJ (status ${res.status}).`)
  }

  const json = await res.json()
  // A API Brasil costuma envelopar a resposta em { response: {...} } ou
  // { data: {...} } dependendo do endpoint — tenta os dois formatos antes
  // de cair no objeto raiz.
  const dados = json?.response ?? json?.data ?? json

  const endereco = dados?.endereco ?? dados?.matrizEndereco ?? dados

  const resultado: DadosCnpj = {
    cnpj: cnpjLimpo,
    razaoSocial: primeiroValor(dados, ['razao_social', 'razaoSocial', 'razao', 'nome']) || '',
    nomeFantasia: primeiroValor(dados, ['nome_fantasia', 'nomeFantasia', 'fantasia']) || '',
    situacaoCadastral: primeiroValor(dados, [
      'situacao_cadastral_descricao',
      'situacaoCadastral',
      'situacao',
    ]) || '',
    telefone: primeiroValor(dados, ['telefone', 'ddd_telefone_1', 'telefone1']),
    email: primeiroValor(dados, ['email']),
    endereco: montarEndereco(endereco),
    cep: primeiroValor(endereco, ['cep']),
    cidade: primeiroValor(endereco, ['municipio', 'cidade']),
    uf: primeiroValor(endereco, ['uf', 'estado']),
  }

  if (!resultado.razaoSocial) {
    console.warn(
      '[apibrasil] Resposta da consulta de CNPJ não trouxe razão social no formato esperado. ' +
      'Confira os nomes de campo reais e ajuste consultarCnpj() em src/lib/apibrasil.ts. Resposta bruta:',
      JSON.stringify(json).slice(0, 2000)
    )
  }

  return resultado
}

function montarEndereco(endereco: any): string | null {
  if (!endereco) return null
  const logradouro = primeiroValor(endereco, ['logradouro', 'tipo_logradouro'])
  const numero = primeiroValor(endereco, ['numero'])
  const complemento = primeiroValor(endereco, ['complemento'])
  const bairro = primeiroValor(endereco, ['bairro'])

  const partes = [logradouro, numero && `nº ${numero}`, complemento, bairro].filter(Boolean)
  return partes.length > 0 ? partes.join(', ') : null
}
