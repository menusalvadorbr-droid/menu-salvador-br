import { createPublicClient } from '@/lib/supabase/publicServer'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

interface AtalhoCustomizado {
  gatilho: string
  resposta: string
}

export interface EstabelecimentoParaAtalho {
  id: string
  endereco: string | null
  numero: string | null
  tipo_logradouro: string | null
  estacionamento: string | null
  whatsapp_atalhos: AtalhoCustomizado[] | null
  bairros: { nome: string } | { nome: string }[] | null
  cidades: { nome: string } | { nome: string }[] | null
}

export const LABEL_ESTACIONAMENTO: Record<string, string> = {
  proprio: 'Sim, temos estacionamento próprio.',
  valet: 'Sim, temos manobrista (valet).',
  rua: 'Temos vaga na rua, ao redor do estabelecimento.',
  nao_tem: 'Não temos estacionamento próprio no local.',
}

/** Camada 1 de atendimento — respostas fixas por palavra-chave, sempre
 *  checadas antes de chamar qualquer IA (custo zero). "horário" e
 *  "endereço" puxam de dado já cadastrado (horarios_funcionamento,
 *  endereco/estacionamento) em vez de duplicar a informação numa segunda
 *  tela que o dono teria que manter atualizada à parte; os demais gatilhos
 *  (ex: "cartão") são editáveis em estabelecimentos.whatsapp_atalhos, já
 *  que não existe campo estruturado equivalente pra puxar. `null` se
 *  nenhum atalho bateu — segue pro fluxo normal de IA. */
export async function resolverAtalho(estabelecimentoId: string, mensagem: string): Promise<string | null> {
  const texto = mensagem.trim().toLowerCase()
  if (!texto) return null

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id, endereco, numero, tipo_logradouro, estacionamento, whatsapp_atalhos, bairros(nome), cidades(nome)')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  if (!data) return null
  const est = data as unknown as EstabelecimentoParaAtalho

  if (contemPalavra(texto, ['horário', 'horario', 'que horas', 'aberto', 'fecha'])) {
    return formatarHorario(supabase, estabelecimentoId)
  }

  if (contemPalavra(texto, ['endereço', 'endereco', 'localização', 'localizacao', 'onde fica', 'onde vocês', 'onde voces'])) {
    return formatarEndereco(est)
  }

  if (contemPalavra(texto, ['estacionamento', 'onde estacionar', 'vaga'])) {
    return LABEL_ESTACIONAMENTO[est.estacionamento || ''] || 'Não temos essa informação cadastrada — confirme com a equipe.'
  }

  for (const atalho of est.whatsapp_atalhos || []) {
    if (atalho.gatilho && texto.includes(atalho.gatilho.trim().toLowerCase())) {
      return atalho.resposta
    }
  }

  return null
}

function contemPalavra(texto: string, gatilhos: string[]): boolean {
  return gatilhos.some((g) => texto.includes(g))
}

function unico<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v
}

/** Exportada — reaproveitada por buildCardapioContext.ts pra montar o
 *  bloco de dados reais do system prompt da IA, mesma formatação usada
 *  aqui pro atalho de palavra-chave "endereço". */
export function formatarEndereco(est: EstabelecimentoParaAtalho): string {
  const bairro = unico(est.bairros)?.nome
  const cidade = unico(est.cidades)?.nome
  if (!est.endereco) return 'Não temos o endereço cadastrado ainda — confirme com a equipe.'
  const partes = [
    [est.tipo_logradouro, est.endereco].filter(Boolean).join(' '),
    est.numero,
    bairro,
    cidade,
  ].filter(Boolean)
  return `📍 ${partes.join(', ')}`
}

/** Exportada — mesmo motivo de formatarEndereco acima. */
export async function formatarHorario(
  supabase: ReturnType<typeof createPublicClient>,
  estabelecimentoId: string
): Promise<string> {
  const { data } = await supabase
    .from('horarios_funcionamento')
    .select('dia_semana, horario_abertura, horario_fechamento, fechado')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('dia_semana')
    .order('horario_abertura')
  const linhas = (data || []) as { dia_semana: number; horario_abertura: string; horario_fechamento: string; fechado: boolean }[]
  if (linhas.length === 0) return 'Não temos o horário de funcionamento cadastrado ainda — confirme com a equipe.'

  const porDia = new Map<number, typeof linhas>()
  for (const linha of linhas) {
    const lista = porDia.get(linha.dia_semana) || []
    lista.push(linha)
    porDia.set(linha.dia_semana, lista)
  }

  const texto = DIAS.map((nomeDia, idx) => {
    const periodos = porDia.get(idx)
    if (!periodos || periodos.length === 0 || periodos.every((p) => p.fechado)) {
      return `${capitaliza(nomeDia)}: fechado`
    }
    const horarios = periodos
      .filter((p) => !p.fechado)
      .map((p) => `${p.horario_abertura.slice(0, 5)} às ${p.horario_fechamento.slice(0, 5)}`)
      .join(' e ')
    return `${capitaliza(nomeDia)}: ${horarios}`
  }).join('\n')

  return `🕒 Horário de funcionamento:\n${texto}`
}

function capitaliza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
