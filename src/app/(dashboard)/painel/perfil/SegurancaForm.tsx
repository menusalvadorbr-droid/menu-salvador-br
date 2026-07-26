'use client'

import { useState } from 'react'
import { trocarSenha } from '../actions'

const COR_TERRACOTA = '#C1541F'
const COR_TEXTO = '#2A2420'

export default function SegurancaForm() {
  const [editando, setEditando] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const senhasConferem = novaSenha.length === 0 || novaSenha === confirmarSenha

  function cancelar() {
    setEditando(false)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setMensagem(null)
  }

  async function salvar() {
    setMensagem(null)
    if (!senhaAtual) {
      setMensagem({ tipo: 'erro', texto: 'Informe sua senha atual.' })
      return
    }
    if (novaSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não conferem.' })
      return
    }

    setSalvando(true)
    try {
      await trocarSenha(senhaAtual, novaSenha)
      setMensagem({ tipo: 'ok', texto: 'Senha atualizada.' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setEditando(false)
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao trocar senha.' })
    }
    setSalvando(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: COR_TEXTO }}>
            Segurança
          </p>
          <p className="mt-0.5 text-xs opacity-60" style={{ color: COR_TEXTO }}>Senha de acesso à sua conta.</p>
        </div>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="shrink-0 rounded-lg border border-black/10 px-4 py-1.5 text-sm font-medium hover:bg-black/[0.02]"
            style={{ color: COR_TEXTO }}
          >
            Editar senha
          </button>
        )}
      </div>

      {editando && (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Senha atual</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Repetir nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${senhasConferem ? 'border-black/10' : 'border-red-400'}`}
            />
            {!senhasConferem && <p className="mt-1 text-xs text-red-500">As senhas não conferem</p>}
          </div>

          {mensagem && (
            <p className={`text-sm ${mensagem.tipo === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{mensagem.texto}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={salvar}
              disabled={salvando || !senhaAtual || !novaSenha || !senhasConferem}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: COR_TERRACOTA }}
            >
              {salvando ? 'Salvando...' : 'Trocar senha'}
            </button>
            <button
              onClick={cancelar}
              className="rounded-lg border border-black/10 px-5 py-2.5 text-sm"
              style={{ color: COR_TEXTO }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
