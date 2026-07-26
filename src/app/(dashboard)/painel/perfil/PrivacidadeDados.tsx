'use client'

import { useState } from 'react'
import { excluirMinhaConta } from '../actions'

const COR_TEXTO = '#2A2420'

export default function PrivacidadeDados({ email }: { email: string }) {
  const [mostrarExclusao, setMostrarExclusao] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const confirmacaoValida = confirmacao.trim().toLowerCase() === email.toLowerCase()

  async function excluir() {
    if (!confirmacaoValida) return
    setErro(null)
    setExcluindo(true)
    try {
      await excluirMinhaConta(confirmacao)
      // excluirMinhaConta faz redirect() em caso de sucesso.
    } catch (err: any) {
      if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err
      setErro(err.message || 'Erro ao excluir conta.')
      setExcluindo(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">Privacidade e dados</p>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: COR_TEXTO }}>Baixar meus dados</p>
          <p className="text-xs opacity-60" style={{ color: COR_TEXTO }}>
            Um arquivo com tudo que guardamos sobre você: perfil, reivindicações, estabelecimentos.
          </p>
        </div>
        <a
          href="/api/painel/exportar-dados"
          download
          className="shrink-0 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/[0.02]"
          style={{ color: COR_TEXTO }}
        >
          Baixar
        </a>
      </div>

      <div className="mt-4 border-t border-red-200 pt-4">
        <p className="text-sm font-medium text-red-800">Excluir minha conta</p>
        <p className="mt-0.5 text-xs opacity-70" style={{ color: COR_TEXTO }}>
          Não tem como desfazer. Estabelecimentos que você administra sozinho ficam sem dono, disponíveis pra
          alguém reivindicar de novo.
        </p>

        {!mostrarExclusao ? (
          <button
            onClick={() => setMostrarExclusao(true)}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Quero excluir minha conta
          </button>
        ) : (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-red-800">
              Digite seu e-mail ({email}) pra confirmar
            </label>
            <input
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder={email}
              className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
            />
            {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
            <div className="mt-2 flex gap-2">
              <button
                onClick={excluir}
                disabled={!confirmacaoValida || excluindo}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
              <button
                onClick={() => { setMostrarExclusao(false); setConfirmacao(''); setErro(null) }}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm"
                style={{ color: COR_TEXTO }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
