import { formatarReais } from '@/lib/moeda'
import type { TipoDesconto } from '@/lib/desconto'
import type { DadosPixEstabelecimento } from '@/lib/pix/buscarDadosPixEstabelecimento'
import SeletorFormaPagamento from '../components/SeletorFormaPagamento'
import PainelPixCobranca from '../components/PainelPixCobranca'
import type { EstilosGarcom } from './estilosGarcom'

/**
 * Desconto + forma de pagamento + cobrança Pix + totais — usado só no modo
 * "Nova venda" do Caixa (finalizarNoAto), onde a venda fecha o pagamento na
 * hora em vez de só lançar o pedido pro board de comandas. Extraído de
 * LancarPedidoGarcom.tsx pra isolar essa parte (que mexe com dinheiro de
 * verdade) do resto da tela (escolher item, listar cardápio).
 */
export default function PainelPagamentoGarcom({
  subtotal,
  descontoNum,
  totalComDesconto,
  tipoDesconto,
  descontoInput,
  onTipoDescontoChange,
  onDescontoInputChange,
  formaPagamento,
  onFormaPagamentoChange,
  valorRecebido,
  onValorRecebidoChange,
  tema,
  dadosPix,
  referenciaPix,
  pixConfirmado,
  onPixConfirmadoChange,
  trocoInsuficiente,
  estilos: c,
}: {
  subtotal: number
  descontoNum: number
  totalComDesconto: number
  tipoDesconto: TipoDesconto
  descontoInput: string
  onTipoDescontoChange: (tipo: TipoDesconto) => void
  onDescontoInputChange: (valor: string) => void
  formaPagamento: string
  onFormaPagamentoChange: (valor: string) => void
  valorRecebido: string
  onValorRecebidoChange: (valor: string) => void
  tema: 'claro' | 'escuro'
  dadosPix: DadosPixEstabelecimento | null
  referenciaPix: string
  pixConfirmado: boolean
  onPixConfirmadoChange: (valor: boolean) => void
  trocoInsuficiente: boolean
  estilos: EstilosGarcom
}) {
  return (
    <div className={`space-y-3 border-t pt-3 ${c.borda}`}>
      <div>
        <label className={`mb-1 block text-xs font-medium ${c.label}`}>
          Desconto <span className="font-normal opacity-70">(opcional)</span>
        </label>
        <div className="flex gap-2">
          <div className={`flex overflow-hidden rounded-lg border ${c.borda}`}>
            <button
              type="button"
              onClick={() => onTipoDescontoChange('valor')}
              className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'valor' ? c.botaoToggleAtivo : c.label}`}
            >
              R$
            </button>
            <button
              type="button"
              onClick={() => onTipoDescontoChange('percentual')}
              className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'percentual' ? c.botaoToggleAtivo : c.label}`}
            >
              %
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={descontoInput}
            onChange={(e) => onDescontoInputChange(e.target.value)}
            placeholder={tipoDesconto === 'percentual' ? 'Ex: 10' : 'Ex: 5,00'}
            className={`flex-1 rounded-lg border px-3 py-2 ${c.input}`}
          />
        </div>
      </div>

      <SeletorFormaPagamento
        formaPagamento={formaPagamento}
        onChangeFormaPagamento={onFormaPagamentoChange}
        valorRecebido={valorRecebido}
        onChangeValorRecebido={onValorRecebidoChange}
        total={totalComDesconto}
        tema={tema}
      />

      {formaPagamento === 'Pix' && (
        <>
          <PainelPixCobranca
            chavePix={dadosPix?.chavePix ?? null}
            nomeFantasia={dadosPix?.nomeFantasia ?? ''}
            cidade={dadosPix?.cidade ?? null}
            valor={totalComDesconto}
            referencia={referenciaPix}
            tema={tema}
          />
          <label className={`flex items-center gap-2 text-sm ${c.label}`}>
            <input
              type="checkbox"
              checked={pixConfirmado}
              onChange={(e) => onPixConfirmadoChange(e.target.checked)}
              className="h-4 w-4"
            />
            Confirmei que o Pix caiu
          </label>
        </>
      )}

      <div className={`space-y-1 border-t pt-3 text-sm ${c.borda}`}>
        <div className={`flex justify-between ${c.label}`}>
          <span>Subtotal</span>
          <span>R$ {formatarReais(subtotal)}</span>
        </div>
        {descontoNum > 0 && (
          <div className={`flex justify-between ${c.label}`}>
            <span>Desconto</span>
            <span>− R$ {formatarReais(descontoNum)}</span>
          </div>
        )}
        <div className={`flex justify-between text-base font-bold ${c.total}`}>
          <span>Total a pagar</span>
          <span>R$ {formatarReais(totalComDesconto)}</span>
        </div>
      </div>

      {trocoInsuficiente && (
        <p className="text-xs font-medium text-red-500">Valor recebido menor que o total — confira antes de confirmar.</p>
      )}
    </div>
  )
}
