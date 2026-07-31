'use client'

import { createContext, useContext, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSacola } from './useSacola'
import SacolaDrawer from './SacolaDrawer'
import FinalizarPedidoModal from './FinalizarPedidoModal'
import StatusConexaoPedidos from '../components/StatusConexaoPedidos'
import BotaoChamarGarcom from './BotaoChamarGarcom'
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

export default function CarrinhoProvider({
  estabelecimentoId,
  whatsapp,
  children,
}: {
  estabelecimentoId: string
  whatsapp?: string
  children: React.ReactNode
}) {
  const sacola = useSacola()
  const { traduzirInterface } = useTraducao()
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  // Se o QR code impresso na mesa tiver ?mesa=12 na URL, já preenche
  // sozinho — o cliente não precisa digitar o número da mesa. QR gerado
  // por mesa (módulo "QR por mesa") também carrega ?mesa_id=<uuid>, que
  // vai direto pro pedido — é o que liga automaticamente ao mapa de mesas
  // e ao caixa, sem depender de casar o texto digitado com o cadastro.
  const searchParams = useSearchParams()
  const mesaFixa = searchParams.get('mesa') || undefined
  const mesaIdFixo = searchParams.get('mesa_id') || undefined

  return (
    <CarrinhoContext.Provider
      value={{
        adicionarItem: sacola.adicionarItem,
        totalItens: sacola.totalItens,
        abrirCarrinho: () => setDrawerAberto(true),
      }}
    >
      {children}

      {mesaFixa && !drawerAberto && !modalAberto && (
        <BotaoChamarGarcom estabelecimentoId={estabelecimentoId} mesa={mesaFixa} temCarrinho={sacola.totalItens > 0} />
      )}

      {sacola.totalItens > 0 && !drawerAberto && !modalAberto && (
        <button
          onClick={() => setDrawerAberto(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-700"
        >
          🛒 {sacola.totalItens} {sacola.totalItens === 1 ? traduzirInterface('item_singular', 'item') : traduzirInterface('itens_label', 'itens')} · R$ {sacola.total.toFixed(2)}
        </button>
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

      <FinalizarPedidoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSucesso={sacola.limparSacola}
        estabelecimentoId={estabelecimentoId}
        whatsappEstabelecimento={whatsapp}
        total={sacola.total}
        items={sacola.itens}
        mesaFixa={mesaFixa}
        mesaIdFixa={mesaIdFixo}
      />

      <StatusConexaoPedidos />
    </CarrinhoContext.Provider>
  )
}
