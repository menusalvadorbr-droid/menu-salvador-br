'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarTelefone, limparTelefone } from '@/lib/utils'
import ModalPerfil from './ModalPerfil'

export default function ModalEditarContato({
  estabelecimento,
  onFechar,
  onSalvo,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estabelecimento: any
  onFechar: () => void
  onSalvo: () => void
}) {
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '')
  const [whatsapp, setWhatsapp] = useState(estabelecimento.whatsapp || '')
  const [instagram, setInstagram] = useState(estabelecimento.instagram || '')
  const [site, setSite] = useState(estabelecimento.site || '')
  const [email, setEmail] = useState(estabelecimento.email || '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    setSalvando(true)
    setErro(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        telefone: limparTelefone(telefone) || null,
        whatsapp: limparTelefone(whatsapp) || null,
        instagram,
        site,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', estabelecimento.id)

    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onSalvo()
  }

  return (
    <ModalPerfil titulo="Editar contato" onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Telefone</label>
          <input type="tel" value={formatarTelefone(telefone)} onChange={(e) => setTelefone(e.target.value)} placeholder="(71) 9xxxx-xxxx" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">WhatsApp</label>
          <input type="tel" value={formatarTelefone(whatsapp)} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(71) 9xxxx-xxxx" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Instagram</label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Site</label>
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar contato'}
        </button>
      </div>
    </ModalPerfil>
  )
}
