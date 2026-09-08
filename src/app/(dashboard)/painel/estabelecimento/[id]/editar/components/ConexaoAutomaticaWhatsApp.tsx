'use client'

import { useState } from 'react'
import { X, Loader2, CircleCheck } from 'lucide-react'

/**
 * Conexão automática de WhatsApp via Embedded Signup da Meta (Menu Salvador
 * como Tech Provider — ver plano discutido). Tela completa desde já,
 * mesmo a integração real ainda não existindo (depende de App Review da
 * Meta) — só a visibilidade é controlada por
 * platform_settings.whatsapp_embedded_signup_ativado (ver
 * /admin/configuracoes). Quando a integração de verdade for construída,
 * o botão abaixo passa a chamar o SDK JS da Meta em vez de abrir o
 * preview do fluxo — o resto da tela já fica pronto.
 */
export default function ConexaoAutomaticaWhatsApp({ readOnly }: { readOnly?: boolean }) {
  const [previewAberto, setPreviewAberto] = useState(false)

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800">Conectar automaticamente</h4>
          <p className="mt-1 max-w-md text-xs text-neutral-500">
            Faça login com a conta da Meta do estabelecimento e conecte o WhatsApp Business em poucos cliques —
            sem precisar copiar token nem ID manualmente.
          </p>
        </div>

        <button
          type="button"
          disabled={readOnly}
          onClick={() => setPreviewAberto(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
          style={{ backgroundColor: '#1877F2' }}
        >
          <LogoMeta />
          Conectar com a Meta
        </button>
      </div>

      {previewAberto && <PreviewFluxo onFechar={() => setPreviewAberto(false)} />}
    </div>
  )
}

function LogoMeta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  )
}

/** Prévia do que o dono vai ver quando a integração real existir — não é
 * mock enganoso (não finge conectar de verdade), é uma amostra clara do
 * passo a passo, pra já dar pra mostrar/validar a experiência antes da
 * aprovação da Meta sair. */
function PreviewFluxo({ onFechar }: { onFechar: () => void }) {
  const passos = [
    { titulo: 'Login com a conta da Meta', descricao: 'Você entra com a conta do Facebook/Instagram do estabelecimento.' },
    { titulo: 'Escolher ou criar a conta do WhatsApp Business', descricao: 'Direto na janela da Meta, sem sair do Menu Salvador.' },
    { titulo: 'Confirmar o número de telefone', descricao: 'Código por SMS ou ligação, tudo dentro do mesmo fluxo.' },
    { titulo: 'Pronto', descricao: 'O status muda pra "Conectado" automaticamente, sem colar token nenhum.' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Como vai funcionar"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Como vai funcionar</h3>
          <button onClick={onFechar} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-neutral-400">
          Essa conexão ainda depende de uma aprovação da Meta que está em andamento — em breve o botão acima abre
          o fluxo de verdade. Por enquanto, use a conexão manual abaixo.
        </p>
        <ol className="flex flex-col gap-3">
          {passos.map((passo, i) => (
            <li key={passo.titulo} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-800">{passo.titulo}</p>
                <p className="text-xs text-neutral-500">{passo.descricao}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          Aguardando aprovação da Meta
        </div>
        <button
          onClick={onFechar}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          <CircleCheck className="h-4 w-4" />
          Entendi
        </button>
      </div>
    </div>
  )
}
