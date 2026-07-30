'use client'

import { ArrowLeft, ChevronRight } from 'lucide-react'
import EditarEstabelecimentoForm from '../editar/EditarEstabelecimentoForm'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function statusBadge(estabelecimento: { status: string; ativo: boolean | null }) {
  if (estabelecimento.status === 'em_analise') {
    return { label: '🕒 Em análise', bg: 'bg-amber-50', text: 'text-amber-700' }
  }
  if (estabelecimento.status === 'blocked') {
    return { label: '🚫 Bloqueado', bg: 'bg-red-50', text: 'text-red-700' }
  }
  if (estabelecimento.ativo === false) {
    return { label: '🙈 Oculto', bg: 'bg-gray-100', text: 'text-gray-600' }
  }
  return { label: '✅ Ativo', bg: 'bg-green-50', text: 'text-green-700' }
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
  tituloPagina?: { icone: string; texto: string }
  /** Controlado pelo chamador — a tela inicial também abre esse mesmo
   *  modal a partir do checklist de perfil, fora deste cabeçalho, então o
   *  estado não pode viver só aqui dentro. */
  contaAberta: boolean
  onAbrirConta: () => void
  onFecharConta: () => void
}

/**
 * Cabeçalho completo reaproveitado nas três telas de gerenciar (início,
 * cardápio, gestão) — saudação, nome do estabelecimento (clicável pra
 * abrir "Conta", quando dono/gerente), badge de status e seta de voltar.
 * Extraído daqui pra não duplicar essa mesma estrutura em cada página.
 */
export default function CabecalhoGerenciar({
  estabelecimento,
  usuarioNome,
  usuarioLogadoId,
  ehDonoOuGerente,
  podeEditar,
  aoVoltar,
  tituloPagina,
  contaAberta,
  onAbrirConta,
  onFecharConta,
}: CabecalhoGerenciarProps) {
  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const primeiroNome = usuarioNome.split(' ')[0] || usuarioNome
  const badge = statusBadge(estabelecimento)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={aoVoltar}
            aria-label="Voltar"
            className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-orange-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-neutral-400">
              {saudacao()}, {primeiroNome}
            </p>
            {ehDonoOuGerente ? (
              <button
                onClick={onAbrirConta}
                className="flex items-center gap-1 text-lg font-bold tracking-tight text-neutral-900 transition hover:text-orange-600"
                title="Ver e editar dados da conta"
              >
                <span className="truncate">{nomeExibicao}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ) : (
              <h1 className="truncate text-lg font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
            )}
            {tituloPagina && (
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-500">
                {tituloPagina.icone} {tituloPagina.texto}
              </p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>

      {contaAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onFecharConta}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="font-semibold text-gray-900">Conta</h2>
              <button
                onClick={onFecharConta}
                className="text-xl leading-none text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <EditarEstabelecimentoForm
                estabelecimento={estabelecimento}
                podeEditar={podeEditar}
                userId={usuarioLogadoId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
