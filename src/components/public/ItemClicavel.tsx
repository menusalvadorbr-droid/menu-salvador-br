'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { useCarrinho } from '@/modules/pedidos/customer/CarrinhoProvider'
import SeletorItemModal from '@/modules/pedidos/customer/SeletorItemModal'
import type { GrupoResolvido, VariacaoResolvida } from '@/modules/pedidos/customer/tiposSelecao'
import { useTraducao, Texto } from './TraducaoCardapio'

interface Alergeno {
  id: string
  nome: string
  icone: string | null
}

interface ItemClicavelProps {
  /** "Clique expande" ligado em Configurações → Recursos do cardápio. Desligado (padrão), renderiza só children, sem interação nenhuma. */
  ativado: boolean
  id: string
  nome: string
  descricao: string | null
  fotoUrl: string | null
  preco: number
  precoPromocional?: number | null
  alergenos: Alergeno[]
  mostrarAlergenos: boolean
  corP: string
  corT: string
  corS: string
  corBd: string
  /** Carrinho ligado em Configurações → Recursos do cardápio — sem isso, nenhum botão de adicionar aparece no painel, só informação. */
  carrinhoAtivado: boolean
  variacoes: VariacaoResolvida[]
  grupos: GrupoResolvido[]
  children: React.ReactNode
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Embrulha a parte informativa (foto + nome + descrição) de um item de
 * cardápio — não o preço/botão de comprar, que fica de fora e continua
 * funcionando normalmente — com um clique que abre um painel (bottom sheet)
 * com a versão ampliada: foto maior, nome completo, descrição sem cortar,
 * alérgenos. Reaproveitado nos dois layouts (Lista e Catálogo), já que o
 * comportamento é independente de tema.
 */
export default function ItemClicavel({
  ativado,
  id,
  nome,
  descricao,
  fotoUrl,
  preco,
  precoPromocional,
  alergenos,
  mostrarAlergenos,
  corP,
  corT,
  corS,
  corBd,
  carrinhoAtivado,
  variacoes,
  grupos,
  children,
}: ItemClicavelProps) {
  const [aberto, setAberto] = useState(false)
  const [tamanhoId, setTamanhoId] = useState<string | null>(null)
  const [seletorAberto, setSeletorAberto] = useState(false)
  const { adicionarItem } = useCarrinho()
  const { traduzirInterface } = useTraducao()

  if (!ativado) return <>{children}</>

  const fotoGrande = getOptimizedCloudinaryUrl(fotoUrl, 600, 400, 'fill')
  const promoOk = precoPromocional != null && precoPromocional < preco

  const temVariacoes = variacoes.length > 0
  // Item com grupo de complemento precisa do fluxo completo (com validação
  // de mín./máx.) que o SeletorItemModal já faz — não vale duplicar essa
  // lógica aqui dentro do painel; só a variação (mais simples, uma escolha
  // só) fica inline neste rodapé.
  const precisaSeletorCompleto = grupos.length > 0
  const variacaoSelecionada = variacoes.find((v) => v.id === tamanhoId) || null
  const precoFinal = variacaoSelecionada
    ? variacaoSelecionada.preco
    : promoOk
    ? precoPromocional!
    : preco

  function handleAdicionar() {
    if (precisaSeletorCompleto) {
      setSeletorAberto(true)
      return
    }
    adicionarItem({
      id,
      nome,
      preco: precoFinal,
      variacao: variacaoSelecionada,
    })
    setAberto(false)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberto(true) } }}
        className="cursor-pointer"
      >
        {children}
      </div>

      {/* Portal pro <body> — sem isso, esse painel "fixed" fica preso dentro
          do card do Modelo Catálogo, que tem hover:scale-105 (transform).
          Um transform no ancestral vira o "containing block" de qualquer
          descendente position:fixed; combinado com o overflow-hidden do
          card, o painel piscava e ficava cortado, ligado/desligado pelo
          próprio hover do card — daí também o clique de fechar não acertar
          (a área clicável real ficava deslocada). Portal tira o painel
          dessa árvore, anexando direto no <body>. */}
      {aberto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setAberto(false)}
        >
          <div
            className="relative flex w-full max-w-lg min-h-[50vh] max-h-[80vh] flex-col rounded-t-2xl border-t shadow-2xl"
            style={{ backgroundColor: corS, borderColor: corBd }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAberto(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
              aria-label={traduzirInterface('fechar', 'Fechar')}
            >
              ✕
            </button>

            <div className="overflow-y-auto">
              {fotoGrande && (
                <div className="relative h-80 w-full bg-gray-100">
                  <Image src={fotoGrande} alt={nome} fill className="object-cover" sizes="512px" unoptimized />
                </div>
              )}

              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold" style={{ color: corT }}>
                  <Texto tipo="item" id={id} campo="nome">{nome}</Texto>
                </h3>

                {descricao && (
                  <p className="text-sm leading-relaxed opacity-80" style={{ color: corT }}>
                    <Texto tipo="item" id={id} campo="descricao">{descricao}</Texto>
                  </p>
                )}

                {mostrarAlergenos && alergenos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {alergenos.map((a) => (
                      <span key={a.id}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                        title={`Alérgeno: ${a.nome}`}>
                        {a.icone && <span>{a.icone}</span>}
                        {a.nome}
                      </span>
                    ))}
                  </div>
                )}

                {!carrinhoAtivado && (
                  <div className="pt-1">
                    {temVariacoes ? (
                      // Sem carrinho não tem como escolher — só mostra o
                      // preço de cada tamanho, informativo (mesmo formato
                      // já usado na listagem quando o carrinho tá desligado).
                      <div className="space-y-1">
                        {[...variacoes].sort((a, b) => a.preco - b.preco).map((v) => (
                          <div key={v.id} className="flex items-baseline justify-between gap-3">
                            <span className="text-sm opacity-70" style={{ color: corT }}>{v.nome}</span>
                            <span className="text-base font-bold" style={{ color: corP }}>R$ {fmt(v.preco)}</span>
                          </div>
                        ))}
                      </div>
                    ) : promoOk ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm line-through opacity-50" style={{ color: corT }}>R$ {fmt(preco)}</span>
                        <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(precoPromocional!)}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(preco)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Preço + botão de adicionar — largura total, fixo na base do
                painel (não rola junto com a descrição). Item com variação
                mostra os tamanhos aqui antes do botão; item com grupo de
                complemento abre o seletor completo já existente. */}
            {carrinhoAtivado && (
              <div className="border-t p-4 space-y-3" style={{ backgroundColor: corS, borderColor: corBd }}>
                {temVariacoes && !precisaSeletorCompleto && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold opacity-70" style={{ color: corT }}>{traduzirInterface('escolha_tamanho', 'Escolha o tamanho')}</p>
                    {variacoes.map((v) => {
                      const selecionado = tamanhoId === v.id
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setTamanhoId(v.id)}
                          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition"
                          style={selecionado ? { borderColor: corP, backgroundColor: `${corP}12` } : { borderColor: corBd }}
                        >
                          <span style={{ color: corT }}>{v.nome}</span>
                          <span className="font-semibold" style={{ color: corP }}>R$ {fmt(v.preco)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-3">
                  {promoOk && !variacaoSelecionada ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm line-through opacity-50" style={{ color: corT }}>R$ {fmt(preco)}</span>
                      <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(precoPromocional!)}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(precoFinal)}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAdicionar}
                  disabled={temVariacoes && !precisaSeletorCompleto && !tamanhoId}
                  className="w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: corP }}
                >
                  {traduzirInterface('adicionar', 'Adicionar')}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {seletorAberto && (
        <SeletorItemModal
          nome={nome}
          precoBase={preco}
          precoPromocionalBase={precoPromocional}
          variacoes={variacoes}
          grupos={grupos}
          corDestaque={corP}
          onFechar={() => setSeletorAberto(false)}
          onConfirmar={(selecao) => {
            adicionarItem({ id, nome, preco: selecao.preco, variacao: selecao.variacao, complementos: selecao.complementos })
            setSeletorAberto(false)
            setAberto(false)
          }}
        />
      )}
    </>
  )
}

/**
 * `onClick` num elemento de DOM só pode existir dentro de um Client
 * Component — `cardapio/[slug]/page.tsx` é Server Component, então não pode
 * escrever `<div onClick={...}>` direto (é exatamente isso que causava
 * "Event handlers cannot be passed to Client Component props" em runtime).
 * Esse wrapper existe só pra isolar o `stopPropagation()` que impede o
 * clique no botão de comprar de também abrir o painel do ItemClicavel que
 * embrulha a linha/card inteiro.
 */
export function PararPropagacaoClique({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  )
}
