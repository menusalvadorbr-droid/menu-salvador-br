'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/app/(dashboard)/painel/components/upload/ImageUpload'
import SeletorCulinariaTags from './components/SeletorCulinariaTags'
import ModalPerfil from './ModalPerfil'

/**
 * Cabeçalho do perfil — nome, descrição, tipo, culinárias, logo e capa.
 * Reaproveita os mesmos campos/consultas de `EditarEstabelecimentoForm.tsx`
 * pra essa parte, só que salvando sozinho (sem o resto do form antigo,
 * que ficou dividido entre este modal e ModalEditarSobre/ModalEditarContato).
 */
export default function ModalEditarCabecalho({
  estabelecimento,
  onFechar,
  onSalvo,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estabelecimento: any
  onFechar: () => void
  onSalvo: () => void
}) {
  const [nomeFantasia, setNomeFantasia] = useState(estabelecimento.nome_fantasia || '')
  const [descricao, setDescricao] = useState(estabelecimento.descricao || '')
  const [logoUrl, setLogoUrl] = useState(estabelecimento.logo_url || '')
  const [fotoCapa, setFotoCapa] = useState(estabelecimento.foto_capa || '')
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState(estabelecimento.tipo_estabelecimento || '')
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<{ slug: string; nome: string; icone: string | null }[]>([])
  const [tiposCozinha, setTiposCozinha] = useState<{ id: number; nome: string; icone: string | null }[]>([])
  const [culinariasSelecionadas, setCulinariasSelecionadas] = useState<number[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('tipos_estabelecimento').select('slug, nome, icone').eq('ativo', true).order('ordem').then(({ data }) => setTiposEstabelecimento(data || []))
    supabase.from('tipos_cozinha').select('id, nome, icone').eq('ativo', true).order('ordem').then(({ data }) => setTiposCozinha(data || []))
    supabase
      .from('estabelecimento_tipos_cozinha')
      .select('tipo_cozinha_id')
      .eq('estabelecimento_id', estabelecimento.id)
      .then(({ data }) => setCulinariasSelecionadas((data || []).map((c) => c.tipo_cozinha_id)))
  }, [estabelecimento.id])

  async function handleSalvar() {
    setSalvando(true)
    setErro(null)
    const supabase = createClient()

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        nome_fantasia: nomeFantasia,
        descricao,
        logo_url: logoUrl || null,
        foto_capa: fotoCapa || null,
        tipo_estabelecimento: tipoEstabelecimento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', estabelecimento.id)

    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }

    // Mesmo diff de culinária de EditarEstabelecimentoForm.tsx: apaga e
    // regrava tudo — volume por estabelecimento é baixo (no máx. 3).
    await supabase.from('estabelecimento_tipos_cozinha').delete().eq('estabelecimento_id', estabelecimento.id)
    if (culinariasSelecionadas.length > 0) {
      const { error: erroCulinaria } = await supabase
        .from('estabelecimento_tipos_cozinha')
        .insert(culinariasSelecionadas.map((tipo_cozinha_id) => ({ estabelecimento_id: estabelecimento.id, tipo_cozinha_id })))
      if (erroCulinaria) {
        setErro('Cabeçalho salvo, mas houve erro ao salvar a culinária: ' + erroCulinaria.message)
        setSalvando(false)
        return
      }
    }

    setSalvando(false)
    onSalvo()
  }

  return (
    <ModalPerfil titulo="Editar cabeçalho" onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Nome fantasia</label>
          <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Logo</label>
            <ImageUpload onUpload={setLogoUrl} defaultImage={logoUrl || null} shape="circle" label="Trocar logo" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Capa</label>
            <ImageUpload onUpload={setFotoCapa} defaultImage={fotoCapa || null} shape="rectangle" label="Trocar capa" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Tipo de estabelecimento</label>
          <select value={tipoEstabelecimento} onChange={(e) => setTipoEstabelecimento(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="">Selecione o tipo</option>
            {tiposEstabelecimento.map((t) => (
              <option key={t.slug} value={t.slug}>{t.icone ? `${t.icone} ` : ''}{t.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Culinária (até 3)</label>
          <SeletorCulinariaTags todos={tiposCozinha} selecionados={culinariasSelecionadas} onChange={setCulinariasSelecionadas} />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar cabeçalho'}
        </button>
      </div>
    </ModalPerfil>
  )
}
