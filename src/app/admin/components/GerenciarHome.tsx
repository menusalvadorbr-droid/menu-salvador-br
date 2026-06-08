// src/app/admin/components/GerenciarHome.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/upload/ImageUpload'

type Modulo = {
  id: string
  slug: string
  nome: string
  ativo: boolean
}

export function GerenciarHome() {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [moduloEditando, setModuloEditando] = useState<Modulo | null>(null)
  const [configuracoes, setConfiguracoes] = useState<Record<string, string>>({})

  const carregarDados = async () => {
    setLoading(true)
    const { data: mod, error } = await supabase
      .from('modulos_home')
      .select('*')
      .order('slug')
    if (error) console.error('Erro ao carregar módulos:', error)
    else setModulos(mod || [])

    const { data: conf } = await supabase.from('configuracoes').select('*')
    const confMap: Record<string, string> = {}
    conf?.forEach((c: any) => { confMap[c.chave] = c.valor })
    setConfiguracoes(confMap)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const toggleModulo = async (slug: string, ativoAtual: boolean) => {
    const novoAtivo = !ativoAtual
    setModulos(prev =>
      prev.map(m => m.slug === slug ? { ...m, ativo: novoAtivo } : m)
    )
    const { error } = await supabase
      .from('modulos_home')
      .update({ ativo: novoAtivo })
      .eq('slug', slug)
    if (error) {
      console.error(error)
      alert('Erro ao atualizar módulo: ' + error.message)
      carregarDados()
    }
  }

  const abrirModal = (modulo: Modulo) => {
    setModuloEditando(modulo)
    setModalAberto(true)
  }

  const salvarConfiguracao = async (chave: string, valor: string) => {
    setConfiguracoes(prev => ({ ...prev, [chave]: valor }))
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ chave, valor }, { onConflict: 'chave' })
    if (error) alert('Erro ao salvar: ' + error.message)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setModuloEditando(null)
  }

  if (loading) return <p>Carregando...</p>

  const editaveis = ['hero', 'banner_topo', 'footer', 'botao_flutuante']

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🏠 Configurar Página Inicial</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Módulos da página</h3>
        <div className="space-y-4">
          {modulos.map((mod) => (
            <div key={mod.slug} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mod.ativo}
                    onChange={() => toggleModulo(mod.slug, mod.ativo)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-medium text-gray-800 w-32">{mod.nome}</span>
                </label>
                {editaveis.includes(mod.slug) && (
                  <button onClick={() => abrirModal(mod)} className="text-blue-600 text-sm hover:underline">
                    ✏️ Editar
                  </button>
                )}
              </div>
              <span className={`text-xs ${mod.ativo ? 'text-green-600' : 'text-red-600'}`}>
                {mod.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edição – contém os campos específicos */}
      {modalAberto && moduloEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">✏️ Editar {moduloEditando.nome}</h3>
            {moduloEditando.slug === 'hero' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Imagem de fundo</label><ImageUpload onUpload={(url) => salvarConfiguracao('hero_background_image', url)} defaultImage={configuracoes['hero_background_image'] || ''} /></div>
                <div><label className="block text-sm font-medium mb-1">Cor da fonte (hex)</label><div className="flex gap-2"><input type="color" value={configuracoes['hero_font_color'] || '#ffffff'} onChange={(e) => salvarConfiguracao('hero_font_color', e.target.value)} /><input type="text" value={configuracoes['hero_font_color'] || '#ffffff'} onChange={(e) => salvarConfiguracao('hero_font_color', e.target.value)} className="border rounded px-3 py-2 w-32" /></div></div>
              </div>
            )}
            {moduloEditando.slug === 'banner_topo' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Texto do banner</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={configuracoes['banner_topo_texto'] || ''} onChange={(e) => salvarConfiguracao('banner_topo_texto', e.target.value)} placeholder="Digite o texto do banner" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={configuracoes['banner_topo_sticky'] === 'true'} onChange={(e) => salvarConfiguracao('banner_topo_sticky', String(e.target.checked))} /><span>Banner fixo no topo (sticky)</span></label>
              </div>
            )}
            {moduloEditando.slug === 'footer' && (
              <div><label className="block text-sm font-medium mb-1">HTML do rodapé</label><textarea rows={6} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" value={configuracoes['footer_html'] || '<p>© 2025 Menu Salvador</p>'} onChange={(e) => salvarConfiguracao('footer_html', e.target.value)} /></div>
            )}
            {moduloEditando.slug === 'botao_flutuante' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Link (WhatsApp)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={configuracoes['botao_flutuante_link'] || 'https://wa.me/5571999999999'} onChange={(e) => salvarConfiguracao('botao_flutuante_link', e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Texto/Ícone</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={configuracoes['botao_flutuante_texto'] || '💬 WhatsApp'} onChange={(e) => salvarConfiguracao('botao_flutuante_texto', e.target.value)} /></div>
              </div>
            )}
            <div className="flex gap-3 mt-6"><button onClick={fecharModal} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}