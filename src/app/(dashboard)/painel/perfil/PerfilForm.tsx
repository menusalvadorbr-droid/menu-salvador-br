'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatarCpf, validarCpf } from '@/lib/cpf'
import { calcularIdade } from '@/lib/idade'
import { atualizarPerfil } from '../actions'

const COR_TERRACOTA = '#C1541F'
const COR_TEXTO = '#2A2420'
const IDADE_MINIMA = 18

interface PerfilFormProps {
  nomeInicial: string
  email: string
  cpfInicial: string
  telefoneInicial: string
  whatsappInicial: string
  dataNascimentoInicial: string
  /** Se veio de um redirecionamento (perfil incompleto), volta pra cá depois de salvar com sucesso. */
  redirectAposSalvar: string | null
}

function ItemChecklist({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm" style={{ color: ok ? '#1F7A4D' : COR_TEXTO, opacity: ok ? 1 : 0.5 }}>
      <span>{ok ? '✓' : '○'}</span>
      {label}
    </li>
  )
}

function formatarDataBr(iso: string): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function PerfilForm({
  nomeInicial,
  email,
  cpfInicial,
  telefoneInicial,
  whatsappInicial,
  dataNascimentoInicial,
  redirectAposSalvar,
}: PerfilFormProps) {
  const router = useRouter()
  // Se a pessoa foi mandada pra cá pra completar o cadastro, já entra
  // editando — não faz sentido mostrar um cartão de leitura vazio e
  // exigir mais um clique em "Editar" antes de conseguir preencher.
  const [editando, setEditando] = useState(Boolean(redirectAposSalvar))

  const [nome, setNome] = useState(nomeInicial)
  const [cpf, setCpf] = useState(cpfInicial)
  const [telefone, setTelefone] = useState(telefoneInicial)
  const [whatsapp, setWhatsapp] = useState(whatsappInicial)
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoInicial)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const cpfValido = cpf.length === 0 || validarCpf(cpf)
  const idade = calcularIdade(dataNascimento)
  const idadeValida = dataNascimento.length === 0 || (idade !== null && idade >= IDADE_MINIMA)

  const cpfOk = cpf.length > 0 && validarCpf(cpf)
  const contatoOk = telefone.trim().length > 0 || whatsapp.trim().length > 0
  const idadeOk = dataNascimento.length > 0 && idade !== null && idade >= IDADE_MINIMA

  function cancelar() {
    setNome(nomeInicial)
    setCpf(cpfInicial)
    setTelefone(telefoneInicial)
    setWhatsapp(whatsappInicial)
    setDataNascimento(dataNascimentoInicial)
    setMensagem(null)
    setEditando(false)
  }

  async function salvar() {
    setMensagem(null)

    if (cpf.length > 0 && !validarCpf(cpf)) {
      setMensagem({ tipo: 'erro', texto: 'CPF inválido. Confira os números digitados.' })
      return
    }
    if (dataNascimento.length > 0 && !idadeValida) {
      setMensagem({ tipo: 'erro', texto: `É preciso ter ${IDADE_MINIMA} anos ou mais.` })
      return
    }

    setSalvando(true)
    try {
      await atualizarPerfil({ nome, cpf, telefone, whatsapp, dataNascimento })

      const agoraCompleto = cpfOk && contatoOk && idadeOk
      if (redirectAposSalvar && agoraCompleto) {
        router.push(redirectAposSalvar)
        return
      }
      setMensagem({ tipo: 'ok', texto: 'Perfil atualizado.' })
      setEditando(false)
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao salvar.' })
    }
    setSalvando(false)
  }

  // ------------------------------------------------------------------
  // Modo leitura — cartão com os dados, botão Editar
  // ------------------------------------------------------------------
  if (!editando) {
    return (
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: COR_TEXTO }}>
              Meus dados
            </p>
          </div>
          <button
            onClick={() => setEditando(true)}
            className="shrink-0 rounded-lg border border-black/10 px-4 py-1.5 text-sm font-medium hover:bg-black/[0.02]"
            style={{ color: COR_TEXTO }}
          >
            Editar
          </button>
        </div>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs opacity-50" style={{ color: COR_TEXTO }}>Nome completo</dt>
            <dd style={{ color: COR_TEXTO }}>{nomeInicial || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-50" style={{ color: COR_TEXTO }}>E-mail</dt>
            <dd style={{ color: COR_TEXTO }}>{email}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-50" style={{ color: COR_TEXTO }}>CPF</dt>
            <dd style={{ color: COR_TEXTO }}>{cpfInicial ? formatarCpf(cpfInicial) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-50" style={{ color: COR_TEXTO }}>Telefone / WhatsApp</dt>
            <dd style={{ color: COR_TEXTO }}>{[telefoneInicial, whatsappInicial].filter(Boolean).join(' · ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-50" style={{ color: COR_TEXTO }}>Data de nascimento</dt>
            <dd style={{ color: COR_TEXTO }}>{dataNascimentoInicial ? formatarDataBr(dataNascimentoInicial) : '—'}</dd>
          </div>
        </dl>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Modo edição — mesmo formulário de sempre
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: COR_TEXTO }}>
          Conta
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Nome completo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>E-mail</label>
            <input
              value={email}
              disabled
              className="w-full rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-sm opacity-50"
            />
            <p className="mt-1 text-xs opacity-50" style={{ color: COR_TEXTO }}>
              Pra trocar o e-mail de acesso, fale com o suporte.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-5" style={{ borderColor: `${COR_TEXTO}0f` }}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: COR_TEXTO }}>
          Verificação de identidade
        </p>
        <p className="mb-3 text-xs opacity-60" style={{ color: COR_TEXTO }}>
          Necessário pra reivindicar ou cadastrar um estabelecimento — preenchendo aqui, você não precisa fazer
          isso de novo depois.
        </p>

        <ul className="mb-4 flex flex-col gap-1 rounded-xl bg-black/[0.02] px-4 py-3">
          <ItemChecklist ok={cpfOk} label="CPF válido" />
          <ItemChecklist ok={contatoOk} label="Telefone ou WhatsApp" />
          <ItemChecklist ok={idadeOk} label={`Data de nascimento (${IDADE_MINIMA}+ anos)`} />
        </ul>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>CPF</label>
            <input
              inputMode="numeric"
              value={formatarCpf(cpf)}
              onChange={(e) => setCpf(e.target.value)}
              maxLength={14}
              placeholder="000.000.000-00"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${cpfValido ? 'border-black/10' : 'border-red-400'}`}
            />
            {!cpfValido && <p className="mt-1 text-xs text-red-500">CPF inválido</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Data de nascimento</label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${idadeValida ? 'border-black/10' : 'border-red-400'}`}
            />
            {!idadeValida && <p className="mt-1 text-xs text-red-500">É preciso ter {IDADE_MINIMA} anos ou mais</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(71) 99999-9999"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: COR_TEXTO }}>WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(71) 99999-9999"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {mensagem && (
        <p className={`text-sm ${mensagem.tipo === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{mensagem.texto}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={salvar}
          disabled={salvando || !nome.trim() || !cpfValido || !idadeValida}
          className="w-fit rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: COR_TERRACOTA }}
        >
          {salvando ? 'Salvando...' : redirectAposSalvar ? 'Salvar e continuar' : 'Salvar'}
        </button>
        {!redirectAposSalvar && (
          <button
            onClick={cancelar}
            className="w-fit rounded-lg border border-black/10 px-5 py-2.5 text-sm"
            style={{ color: COR_TEXTO }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
