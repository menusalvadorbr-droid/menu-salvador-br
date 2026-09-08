import { useState } from 'react'
import { Smartphone, Check } from 'lucide-react'
import { formatarReais } from '@/lib/moeda'
import type { DadosPixEstabelecimento } from '@/lib/pix/buscarDadosPixEstabelecimento'
import SeletorFormaPagamento from '../components/SeletorFormaPagamento'
import OverlayPixCliente from './OverlayPixCliente'
import type { EstilosGarcom } from './estilosGarcom'

/**
 * Forma de pagamento + Pix + total a pagar — só aparece depois que o
 * operador toca em "Receber pagamento" (ver LancarPedidoGarcom.tsx), pra
 * não disputar espaço com o carrinho enquanto ele ainda está montando o
 * pedido. Desconto fica de fora daqui de propósito — é editável junto com
 * o carrinho (dado da venda, não do pagamento em si), então continua
 * visível o tempo todo, não só nesse painel.
 *
 * Sem QR code exposto aqui — só dois botões (mostrar pro cliente numa
 * tela cheia à parte, e confirmar que caiu). O QR em si mora só em
 * OverlayPixCliente.tsx.
 */
export default function PainelPagamentoGarcom({
  totalComDesconto,
  descontoNum,
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
  totalComDesconto: number
  descontoNum: number
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
  // Pix em destaque pro cliente: assim que o operador escolhe Pix, a tela
  // cheia já abre sozinha (o QR é o próximo passo óbvio) — sem precisar de
  // um toque a mais em "Mostrar pro cliente". Ajuste de estado durante o
  // render (padrão documentado do React pra "resetar estado quando uma
  // prop muda"), não um useEffect+setState — dispensa closing manual
  // reabrir sozinho enquanto o método continuar sendo Pix, sem o
  // cascading-render que um efeito teria aqui.
  const [formaPagamentoAnterior, setFormaPagamentoAnterior] = useState(formaPagamento)
  const [overlayFechadoManualmente, setOverlayFechadoManualmente] = useState(false)
  if (formaPagamento !== formaPagamentoAnterior) {
    setFormaPagamentoAnterior(formaPagamento)
    setOverlayFechadoManualmente(false)
  }
  const overlayClienteAberto = formaPagamento === 'Pix' && !overlayFechadoManualmente

  return (
    <div className="space-y-3">
      {/* Total sempre no topo desse painel — a conta não pode sumir de
          vista enquanto o operador escolhe a forma de pagamento. */}
      <div className={`rounded-xl p-3 ${c.destaque}`}>
        <div className="flex items-baseline justify-between">
          <span className={`text-sm font-medium ${c.label}`}>Total a pagar</span>
          <span className={`text-2xl font-black ${c.total}`}>R$ {formatarReais(totalComDesconto)}</span>
        </div>
        {descontoNum > 0 && (
          <p className={`mt-0.5 text-xs ${c.label}`}>Desconto aplicado: − R$ {formatarReais(descontoNum)}</p>
        )}
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOverlayFechadoManualmente(false)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Smartphone className="h-4 w-4" /> Mostrar ao cliente
          </button>
          <button
            type="button"
            onClick={() => onPixConfirmadoChange(!pixConfirmado)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${
              pixConfirmado ? 'bg-emerald-600 text-white hover:bg-emerald-700' : `border ${c.borda} ${c.label} hover:bg-black/5`
            }`}
          >
            <Check className="h-4 w-4" /> {pixConfirmado ? 'Recebimento confirmado' : 'Confirmar recebimento'}
          </button>
        </div>
      )}

      {overlayClienteAberto && (
        <OverlayPixCliente
          chavePix={dadosPix?.chavePix ?? null}
          nomeFantasia={dadosPix?.nomeFantasia ?? ''}
          cidade={dadosPix?.cidade ?? null}
          valor={totalComDesconto}
          referencia={referenciaPix}
          pixConfirmado={pixConfirmado}
          onPixConfirmadoChange={onPixConfirmadoChange}
          onFechar={() => setOverlayFechadoManualmente(true)}
        />
      )}

      {trocoInsuficiente && (
        <p className="text-xs font-medium text-red-500">Valor recebido menor que o total — confira antes de confirmar.</p>
      )}
    </div>
  )
}
