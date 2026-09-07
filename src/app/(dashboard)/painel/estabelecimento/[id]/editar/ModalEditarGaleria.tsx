'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GaleriaUpload from '@/app/(dashboard)/painel/components/upload/GaleriaUpload'
import ModalPerfil from './ModalPerfil'

const LIMITE_FOTOS = 10

/**
 * `GaleriaUpload` (genérico, já usado em outras partes do painel) cuida
 * do upload/reordenação/exclusão local; este modal só persiste o array
 * final em `estabelecimentos.galeria_fotos` a cada mudança.
 */
export default function ModalEditarGaleria({
  estabelecimentoId,
  fotosIniciais,
  onFechar,
  onSalvo,
}: {
  estabelecimentoId: string
  fotosIniciais: string[]
  onFechar: () => void
  onSalvo: () => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function persistir(novasFotos: string[]) {
    setSalvando(true)
    setErro(null)
    const supabase = createClient()
    const { error } = await supabase.from('estabelecimentos').update({ galeria_fotos: novasFotos }).eq('id', estabelecimentoId)
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onSalvo()
  }

  return (
    <ModalPerfil titulo="Editar galeria" onFechar={onFechar}>
      <GaleriaUpload imagensIniciais={fotosIniciais} limite={LIMITE_FOTOS} onUpdate={persistir} />
      {salvando && <p className="mt-2 text-xs text-neutral-400">Salvando…</p>}
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </ModalPerfil>
  )
}
