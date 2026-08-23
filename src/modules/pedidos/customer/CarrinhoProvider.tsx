'use client'

import { createContext, useContext, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSacola } from './useSacola'
import SacolaDrawer from './SacolaDrawer'
import FinalizarPedidoModal from './FinalizarPedidoModal'
import StatusConexaoPedidos from '../components/StatusConexaoPedidos'
import BotaoChamarGarcom from './BotaoChamarGarcom'
import { obterPedidoAcompanhadoSalvo } from './pedidoAcompanhamentoStorage'
import { useTraducao } from '@/components/public/TraducaoCardapio'

interface CarrinhoContextValue {
  adicionarItem: ReturnType<typeof useSacola>['adicionarItem']
  totalItens: number
  abrirCarrinho: () => void
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null)

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>')
  return ctx
}

type SacolaState = ReturnType<typeof useSacola>

export default function CarrinhoProvider({
  estabelecimentoId,
  slug,
  whatsapp,
  children,
}: {
  estabelecimentoId: string
  slug: string
  whatsapp?: string
  children: React.ReactNode
}) {
  const sacola = useSacola()
  const { traduzirInterface } = useTraducao()
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <CarrinhoContext.Provider
      value={{
        adicionarItem: sacola.adicionarItem,
        totalItens: sacola.totalItens,
        abrirCarrinho: () => setDrawerAberto(true),
      }}
    >
      {children}

      {sacola.totalItens > 0 && !drawerAberto && !modalAberto && (
        <button
          onClick={() => setDrawerAberto(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-700"
        >
          🛒 {sacola.totalItens} {sacola.totalItens === 1 ? traduzirInterface('item_singular', 'item') : traduzirInterface('itens_label', 'itens')} · R$ {sacola.total.toFixed(2)}
        </button>
      )}

      {/* Mesmo espaço do botão do carrinho (bottom-right) — só aparece
          quando ele não está, já que a sacola vazia é justamente quando
          "voltar a acompanhar o pedido de antes" é mais útil. */}
      {sacola.totalItens === 0 && !drawerAberto && !modalAberto && (
        <BotaoVoltarAcompanhamento slug={slug} />
      )}

      <SacolaDrawer
        aberto={drawerAberto}
        itens={sacola.itens}
        total={sacola.total}
        onFechar={() => setDrawerAberto(false)}
        onRemover={sacola.removerItem}
        onAlterarQuantidade={sacola.alterarQuantidade}
        onFinalizar={() => {
          setDrawerAberto(false)
          setModalAberto(true)
        }}
      />

      {/* useSearchParams() (mesa/mesa_id do QR code) precisa de Suspense pra
          não travar a página inteira fora do ISR — sem isso, a página do
          cardápio inteira virava dinâmica de novo (mesmo problema do
          layout com cookies()). Só esta parte fica de fora do HTML
          estático/cacheado; preenche logo após a hidratação no cliente. */}
      <Suspense fallback={null}>
        <CarrinhoExtrasDaMesa
          estabelecimentoId={estabelecimentoId}
          slug={slug}
          whatsapp={whatsapp}
          sacola={sacola}
          drawerAberto={drawerAberto}
          modalAberto={modalAberto}
          onFecharModal={() => setModalAberto(false)}
        />
      </Suspense>

      <StatusConexaoPedidos />
    </CarrinhoContext.Provider>
  )
}

/** Botão "chamar garçom" + modal de finalizar pedido — os dois únicos
 *  pedaços do carrinho que dependem de ?mesa=/?mesa_id= na URL. */
function CarrinhoExtrasDaMesa({
  estabelecimentoId,
  slug,
  whatsapp,
  sacola,
  drawerAberto,
  modalAberto,
  onFecharModal,
}: {
  estabelecimentoId: string
  slug: string
  whatsapp?: string
  sacola: SacolaState
  drawerAberto: boolean
  modalAberto: boolean
  onFecharModal: () => void
}) {
  // Se o QR code impresso na mesa tiver ?mesa=12 na URL, já preenche
  // sozinho — o cliente não precisa digitar o número da mesa. QR gerado
  // por mesa (módulo "QR por mesa") também carrega ?mesa_id=<uuid>, que
  // vai direto pro pedido — é o que liga automaticamente ao mapa de mesas
  // e ao caixa, sem depender de casar o texto digitado com o cadastro.
  const searchParams = useSearchParams()
  const mesaFixa = searchParams.get('mesa') || undefined
  const mesaIdFixo = searchParams.get('mesa_id') || undefined

  return (
    <>
      {mesaFixa && !drawerAberto && !modalAberto && (
        <BotaoChamarGarcom estabelecimentoId={estabelecimentoId} mesa={mesaFixa} temCarrinho={sacola.totalItens > 0} />
      )}

      <FinalizarPedidoModal
        aberto={modalAberto}
        onFechar={onFecharModal}
        onSucesso={sacola.limparSacola}
        estabelecimentoId={estabelecimentoId}
        slug={slug}
        whatsappEstabelecimento={whatsapp}
        total={sacola.total}
        items={sacola.itens}
        mesaFixa={mesaFixa}
        mesaIdFixa={mesaIdFixo}
      />
    </>
  )
}

/** "Voltar a acompanhar" — se a pessoa fez um pedido recente nesse mesmo
 *  estabelecimento (salvo em pedidoAcompanhamentoStorage.ts ao finalizar) e
 *  voltou pro cardápio sem carrinho ativo, oferece o link direto de novo em
 *  vez de deixá-la procurar. */
function BotaoVoltarAcompanhamento({ slug }: { slug: string }) {
  const { traduzirInterface } = useTraducao()
  const [pedidoId, setPedidoId] = useState<string | null>(null)

  useEffect(() => {
    // Leitura pontual do localStorage no mount (não uma inscrição em algo
    // que muda) — só pode rodar no cliente (SSR não tem localStorage), daí
    // o efeito em vez de inicializar o useState direto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPedidoId(obterPedidoAcompanhadoSalvo(slug))
  }, [slug])

  if (!pedidoId) return null

  return (
    <Link
      href={`/cardapio/${slug}/pedido/${pedidoId}`}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-700"
    >
      📍 {traduzirInterface('acompanhar_meu_pedido', 'Acompanhar meu pedido')}
    </Link>
  )
}
