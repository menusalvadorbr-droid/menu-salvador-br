'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Clock, ShieldAlert, EyeOff, CheckCircle2 } from 'lucide-react'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function statusBadge(estabelecimento: { status: string; ativo: boolean | null }) {
  if (estabelecimento.status === 'em_analise') {
    return { label: 'Em análise', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/10', Icone: Clock }
  }
  if (estabelecimento.status === 'blocked') {
    return { label: 'Bloqueado', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/10', Icone: ShieldAlert }
  }
  if (estabelecimento.ativo === false) {
    return { label: 'Oculto', bg: 'bg-neutral-100', text: 'text-neutral-600', ring: 'ring-neutral-600/10', Icone: EyeOff }
  }
  return { label: 'Ativo', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/10', Icone: CheckCircle2 }
}

interface CabecalhoGerenciarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estabelecimento: any
  usuarioNome: string
  usuarioLogadoId: string
  ehDonoOuGerente: boolean
  podeEditar: boolean
  /** Pra onde a seta de voltar leva — cada página decide o próprio nível. */
  aoVoltar: () => void
  /** Título da página específica (ex: "Cardápio", "Gestão") — exibido
   *  dentro deste mesmo cabeçalho, não como substituto dele. Omitido na
   *  tela inicial de gerenciar, que não precisa desse subtítulo. */
  tituloPagina?: { icone: ReactNode; texto: string }
  /** @deprecated Não usado mais aqui — o clique no nome agora navega pro
   *  espelho clicável (/editar), em vez de abrir o modal "Conta" antigo.
   *  Mantido na interface só pra não obrigar troca simultânea nos 5
   *  chamadores; pode ser removido quando cada um for limpo. */
  contaAberta?: boolean
  onAbrirConta?: () => void
  onFecharConta?: () => void
}

/**
 * Cabeçalho completo reaproveitado nas telas de gerenciar (início,
 * cardápio, cardápio V2, gestão, configurações) — saudação, nome do
 * estabelecimento (clicável, leva pro editor de perfil quando
 * dono/gerente), badge de status e seta de voltar. Extraído daqui pra não
 * duplicar essa mesma estrutura em cada página.
 */
export default function CabecalhoGerenciar({
  estabelecimento,
  usuarioNome,
  ehDonoOuGerente,
  aoVoltar,
  tituloPagina,
}: CabecalhoGerenciarProps) {
  const router = useRouter()
  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const primeiroNome = usuarioNome.split(' ')[0] || usuarioNome
  const inicial = (nomeExibicao || '?').trim().charAt(0).toUpperCase()
  const badge = statusBadge(estabelecimento)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={aoVoltar}
            aria-label="Voltar"
            className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 sm:flex">
            {inicial}
          </div>

          <div className="min-w-0">
            <p className="text-xs text-neutral-400">
              {saudacao()}, {primeiroNome}
            </p>
            {ehDonoOuGerente ? (
              <button
                onClick={() => router.push(`/painel/estabelecimento/${estabelecimento.id}/editar`)}
                className="flex items-center gap-1 text-lg font-bold tracking-tight text-neutral-900 transition hover:text-orange-600"
                title="Editar perfil do estabelecimento"
              >
                <span className="truncate">{nomeExibicao}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ) : (
              <h1 className="truncate text-lg font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
            )}
            {tituloPagina && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-neutral-500">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {tituloPagina.icone}
                </span>
                {tituloPagina.texto}
              </p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badge.bg} ${badge.text} ${badge.ring}`}
        >
          <badge.Icone className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>
    </>
  )
}
