// src/app/painel/components/PerfilTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/upload/ImageUpload'
import GaleriaUpload from '@/components/upload/GaleriaUpload'

// ---------- máscaras ----------
function formatarCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length <= 2) return numeros
  if (numeros.length <= 5) return numeros.replace(/^(\d{2})(\d{0,3})/, '$1.$2')
  if (numeros.length <= 8) return numeros.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
  if (numeros.length <= 12) return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
}

function aplicarMascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length === 0) return ''
  if (numeros.length <= 2) return `(${numeros}`
  if (numeros.length <= 6) return `(${numeros.slice(0,2)}) ${numeros.slice(2)}`
  if (numeros.length <= 10) return `(${numeros.slice(0,2)}) ${numeros.slice(2,6)}-${numeros.slice(6)}`
  return `(${numeros.slice(0,2)}) ${numeros.slice(2,7)}-${numeros.slice(7,11)}`
}

function aplicarMascaraCEP(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length <= 5) return numeros
  return `${numeros.slice(0,5)}-${numeros.slice(5,8)}`
}

function formatarTelefone(valor: string): string {
  return aplicarMascaraTelefone(valor)
}

// ---------- props ----------
interface PerfilTabProps {
  estabelecimento: any
  perfil: {
    cnpj: string
    razao_social: string
    nome_fantasia: string
    endereco: string
    bairro: string
    cep: string
    telefone: string
    whatsapp: string
    instagram: string
    email: string
    latitude: number | null
    longitude: number | null
    tipos_cozinha_ids: number[]
  }
  setPerfil: React.Dispatch<React.SetStateAction<any>>
  editandoPerfil: boolean
  setEditandoPerfil: (value: boolean) => void
  salvandoPerfil: boolean
  buscandoCnpj: boolean
  onBuscarCnpj: (cnpj: string) => Promise<void>
  onSalvarPerfil: () => Promise<void>
  onSalvarFotoCapa: (url: string) => void
  onSalvarLogo: (url: string) => void
  onAtualizarGaleria: (urls: string[]) => void
  limiteGaleria: number
}

export function PerfilTab({
  estabelecimento,
  perfil,
  setPerfil,
  editandoPerfil,
  setEditandoPerfil,
  salvandoPerfil,
  buscandoCnpj,
  onBuscarCnpj,
  onSalvarPerfil,
  onSalvarFotoCapa,
  onSalvarLogo,
  onAtualizarGaleria,
  limiteGaleria,
}: PerfilTabProps) {
  const [tiposCozinhaDisponiveis, setTiposCozinhaDisponiveis] = useState<any[]>([])
  const [latInput, setLatInput] = useState(perfil.latitude !== null ? perfil.latitude.toString().replace('.', ',') : '')
  const [lonInput, setLonInput] = useState(perfil.longitude !== null ? perfil.longitude.toString().replace('.', ',') : '')

  // Estado local para o CNPJ da consulta
  const [cnpjBusca, setCnpjBusca] = useState('')

  useEffect(() => {
    const carregarTipos = async () => {
      const { data } = await supabase
        .from('tipos_cozinha')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      if (data) setTiposCozinhaDisponiveis(data)
    }
    carregarTipos()
  }, [])

  useEffect(() => { setLatInput(perfil.latitude !== null ? perfil.latitude.toString().replace('.', ',') : '') }, [perfil.latitude])
  useEffect(() => { setLonInput(perfil.longitude !== null ? perfil.longitude.toString().replace('.', ',') : '') }, [perfil.longitude])

  const toggleTipoCozinha = (id: number) => {
    const atuais = perfil.tipos_cozinha_ids || []
    if (atuais.includes(id)) {
      setPerfil({ ...perfil, tipos_cozinha_ids: atuais.filter(i => i !== id) })
    } else {
      setPerfil({ ...perfil, tipos_cozinha_ids: [...atuais, id] })
    }
  }

  const handleConsultar = async () => {
    const numeros = cnpjBusca.replace(/\D/g, '')
    if (numeros.length !== 14) return
    await onBuscarCnpj(numeros)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🏢 Perfil do Estabelecimento</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Dados Cadastrais</h3>
          {!editandoPerfil && (
            <button onClick={() => setEditandoPerfil(true)} className="text-blue-600 text-sm">✏️ Editar</button>
          )}
        </div>

        {editandoPerfil ? (
          <div className="space-y-6">
            {/* Consulta CNPJ */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Consulta CNPJ</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cnpjBusca}
                  onChange={(e) => setCnpjBusca(e.target.value)}
                  className="border rounded-lg px-3 py-2 flex-1"
                  placeholder="Digite o CNPJ (apenas números)"
                />
                <button
                  type="button"
                  onClick={handleConsultar}
                  disabled={buscandoCnpj || cnpjBusca.replace(/\D/g, '').length !== 14}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {buscandoCnpj ? 'Buscando...' : '🔍 Consultar'}
                </button>
              </div>
            </div>

            {/* Dados da empresa (apenas leitura) – sem títulos */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-blue-600">Razão Social</span>
                  <p className="font-medium text-gray-800">{perfil.razao_social || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-600">CNPJ</span>
                  <p className="font-medium text-gray-800">{perfil.cnpj ? formatarCNPJ(perfil.cnpj) : '—'}</p>
                </div>
              </div>
            </div>

            {/* Dados editáveis */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Dados do Estabelecimento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                  <input type="text" value={perfil.nome_fantasia} onChange={(e) => setPerfil({ ...perfil, nome_fantasia: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" value={perfil.endereco} onChange={(e) => setPerfil({ ...perfil, endereco: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" value={perfil.bairro} onChange={(e) => setPerfil({ ...perfil, bairro: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" value={aplicarMascaraCEP(perfil.cep)} onChange={(e) => { const raw = e.target.value.replace(/\D/g, '').slice(0, 8); setPerfil({ ...perfil, cep: raw }) }} className="border rounded-lg px-3 py-2 w-full" placeholder="00000-000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={aplicarMascaraTelefone(perfil.telefone)} onChange={(e) => { let raw = e.target.value.replace(/\D/g, ''); if (raw.length > 11) raw = raw.slice(0, 11); setPerfil({ ...perfil, telefone: raw }) }} className="border rounded-lg px-3 py-2 w-full" placeholder="(71) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="text" value={aplicarMascaraTelefone(perfil.whatsapp)} onChange={(e) => { let raw = e.target.value.replace(/\D/g, ''); if (raw.length > 11) raw = raw.slice(0, 11); setPerfil({ ...perfil, whatsapp: raw }) }} className="border rounded-lg px-3 py-2 w-full" placeholder="(71) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input type="text" value={perfil.instagram} onChange={(e) => setPerfil({ ...perfil, instagram: e.target.value.replace('@', '') })} className="border rounded-lg px-3 py-2 w-full" placeholder="@seudominio" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} className="border rounded-lg px-3 py-2 w-full" />
                </div>
              </div>
            </div>

            {/* Localização (somente manual) */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Localização</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={latInput}
                    onChange={(e) => {
                      setLatInput(e.target.value)
                    }}
                    onBlur={(e) => {
                      let raw = e.target.value.trim()
                      if (raw === '') {
                        setPerfil({ ...perfil, latitude: null })
                        setLatInput('')
                        return
                      }
                      let num = parseFloat(raw.replace(',', '.'))
                      if (!isNaN(num) && num >= -90 && num <= 90) {
                        setPerfil({ ...perfil, latitude: num })
                        setLatInput(num.toString().replace('.', ','))
                      } else {
                        setLatInput(perfil.latitude !== null ? perfil.latitude.toString().replace('.', ',') : '')
                      }
                    }}
                    className="border rounded-lg px-3 py-2 w-full"
                    placeholder="Ex: -12,98"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lonInput}
                    onChange={(e) => {
                      setLonInput(e.target.value)
                    }}
                    onBlur={(e) => {
                      let raw = e.target.value.trim()
                      if (raw === '') {
                        setPerfil({ ...perfil, longitude: null })
                        setLonInput('')
                        return
                      }
                      let num = parseFloat(raw.replace(',', '.'))
                      if (!isNaN(num) && num >= -180 && num <= 180) {
                        setPerfil({ ...perfil, longitude: num })
                        setLonInput(num.toString().replace('.', ','))
                      } else {
                        setLonInput(perfil.longitude !== null ? perfil.longitude.toString().replace('.', ',') : '')
                      }
                    }}
                    className="border rounded-lg px-3 py-2 w-full"
                    placeholder="Ex: -38,46"
                  />
                </div>
                {/* Nenhum botão ou texto extra */}
              </div>
            </div>

            {/* Tipos de Cozinha */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tipos de Cozinha</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tiposCozinhaDisponiveis.map((tipo) => {
                  const isChecked = (perfil.tipos_cozinha_ids || []).includes(tipo.id)
                  return (
                    <label key={tipo.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleTipoCozinha(tipo.id)} className="rounded text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-gray-800">{tipo.nome}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-2">
              <button onClick={onSalvarPerfil} disabled={salvandoPerfil} className="bg-orange-600 text-white px-4 py-2 rounded-lg">{salvandoPerfil ? 'Salvando...' : '💾 Salvar Perfil'}</button>
              <button onClick={() => setEditandoPerfil(false)} className="border px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        ) : (
          // Modo visualização (sem alterações)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {perfil.cnpj && <div><span className="text-gray-500">CNPJ:</span> <p className="font-medium">{formatarCNPJ(perfil.cnpj)}</p></div>}
            {perfil.razao_social && <div><span className="text-gray-500">Razão Social:</span> <p className="font-medium">{perfil.razao_social}</p></div>}
            <div><span className="text-gray-500">Nome Fantasia:</span> <p className="font-medium">{perfil.nome_fantasia}</p></div>
            <div><span className="text-gray-500">Endereço:</span> <p className="font-medium">{perfil.endereco}</p></div>
            <div><span className="text-gray-500">Bairro:</span> <p className="font-medium">{perfil.bairro}</p></div>
            <div><span className="text-gray-500">CEP:</span> <p className="font-medium">{perfil.cep}</p></div>
            <div><span className="text-gray-500">Telefone:</span> <p className="font-medium">{formatarTelefone(perfil.telefone)}</p></div>
            <div><span className="text-gray-500">WhatsApp:</span> <p className="font-medium">{formatarTelefone(perfil.whatsapp)}</p></div>
            <div><span className="text-gray-500">Instagram:</span> <p className="font-medium">{perfil.instagram}</p></div>
            <div><span className="text-gray-500">Email:</span> <p className="font-medium">{perfil.email}</p></div>
            {(perfil.tipos_cozinha_ids || []).length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Tipos de Cozinha:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tiposCozinhaDisponiveis
                    .filter(t => perfil.tipos_cozinha_ids?.includes(t.id))
                    .map(tipo => (
                      <span key={tipo.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{tipo.nome}</span>
                    ))}
                </div>
              </div>
            )}
            {perfil.latitude && perfil.longitude && (
              <div className="col-span-2">
                <span className="text-gray-500">Coordenadas:</span>
                <p className="font-medium">{perfil.latitude}, {perfil.longitude}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção de imagens */}
      <div className="mt-8 space-y-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">🖼️ Imagens</h3>
          <div className="space-y-6">
            <div><h4 className="font-medium mb-2">Foto de Capa</h4><ImageUpload onUpload={onSalvarFotoCapa} defaultImage={estabelecimento?.foto_capa || ''} /></div>
            <div><h4 className="font-medium mb-2">Logo</h4><div className="flex items-start gap-4">{estabelecimento?.logo_url && <img src={estabelecimento.logo_url} className="w-20 h-20 rounded-full object-cover" alt="Logo" />}<ImageUpload onUpload={onSalvarLogo} defaultImage={estabelecimento?.logo_url || ''} /></div></div>
            <div><h4 className="font-medium mb-2">Galeria (até {limiteGaleria} fotos)</h4><GaleriaUpload imagensIniciais={estabelecimento?.galeria_fotos || []} limite={limiteGaleria} onUpdate={onAtualizarGaleria} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}