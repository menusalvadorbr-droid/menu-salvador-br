'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, ClipboardList, Package, Wallet, Truck, MessageCircle, ListChecks } from 'lucide-react'
import { contarInsumosAbaixoDoPontoReposicao } from '@/modules/estoque/estoqueRepository'
import { contarPendenciasOperador } from '@/modules/operador/operadorRepository'

interface ModuloGestaoProps {
  estabelecimentoId: string
  ativado: boolean
}

// Cada atalho tem sua própria cor de destaque — ajuda a reconhecer a área
// de longe, mesmo princípio das cores por módulo da tela inicial. Strings
// sempre literais (nunca concatenadas em runtime) pra o Tailwind conseguir
// escanear essas classes.
const ITENS = [
  { slug: 'pedidos', label: 'Pedidos', Icone: ClipboardList, bg: 'bg-sky-50', text: 'text-sky-600', hoverBorder: 'hover:border-sky-200' },
  { slug: 'estoque', label: 'Estoque', Icone: Package, bg: 'bg-amber-50', text: 'text-amber-600', hoverBorder: 'hover:border-amber-200' },
  { slug: 'caixa', label: 'Caixa', Icone: Wallet, bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-200' },
  { slug: 'fornecedores', label: 'Fornecedores', Icone: Truck, bg: 'bg-violet-50', text: 'text-violet-600', hoverBorder: 'hover:border-violet-200' },
  { slug: 'atendimento', label: 'Atendimento', Icone: MessageCircle, bg: 'bg-teal-50', text: 'text-teal-600', hoverBorder: 'hover:border-teal-200' },
  { slug: 'operador', label: 'Fila do Operador', Icone: ListChecks, bg: 'bg-rose-50', text: 'text-rose-600', hoverBorder: 'hover:border-rose-200' },
] as const

/**
 * Antes eram 4 links soltos no cabeçalho da tela de gerenciar. Viraram um
 * módulo à parte pra ficar simétrico com o módulo Cardápio — sempre
 * visível pra todo estabelecimento (não escondido), mas com aparência
 * apagada e sem clique até o dono ligar "Ativar módulo de Gestão" em
 * Configurações (GestaoTab.tsx), sinalizando que a função existe mas não
 * está em uso ainda.
 */
export default function ModuloGestao({ estabelecimentoId, ativado }: ModuloGestaoProps) {
  const [insumosAbaixoReposicao, setInsumosAbaixoReposicao] = useState(0)
  const [pendenciasOperador, setPendenciasOperador] = useState(0)

  useEffect(() => {
    if (!ativado) return
    contarInsumosAbaixoDoPontoReposicao(estabelecimentoId).then(setInsumosAbaixoReposicao).catch(() => {})
    contarPendenciasOperador(estabelecimentoId).then(setPendenciasOperador).catch(() => {})
  }, [estabelecimentoId, ativado])

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6">
      {!ativado && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="h-5 w-5 shrink-0" />
          Módulo de Gestão desativado. Peça ao dono ou gerente pra ligar em Configurações → Módulo de Gestão.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ITENS.map((item) =>
          ativado ? (
            <Link
              key={item.slug}
              href={`/painel/estabelecimento/${estabelecimentoId}/${item.slug}`}
              className={`group relative flex flex-col items-center gap-2.5 rounded-xl border border-neutral-100 bg-white px-4 py-6 text-center shadow-sm transition hover:shadow-md ${item.hoverBorder}`}
            >
              {item.slug === 'estoque' && insumosAbaixoReposicao > 0 && (
                <span
                  title={`${insumosAbaixoReposicao} insumo(s) abaixo do ponto de reposição`}
                  className="absolute top-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white"
                >
                  {insumosAbaixoReposicao}
                </span>
              )}
              {item.slug === 'operador' && pendenciasOperador > 0 && (
                <span
                  title={`${pendenciasOperador} pendência(s) na Fila do Operador`}
                  className="absolute top-2 right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white"
                >
                  {pendenciasOperador}
                </span>
              )}
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} ${item.text}`}>
                <item.Icone className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-neutral-700">{item.label}</span>
            </Link>
          ) : (
            <div
              key={item.slug}
              aria-disabled="true"
              title="Módulo de Gestão desativado"
              className="flex cursor-not-allowed flex-col items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-6 text-center opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                <item.Icone className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-neutral-400">{item.label}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
