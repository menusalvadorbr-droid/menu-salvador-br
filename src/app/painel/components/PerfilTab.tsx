// src/app/painel/components/PerfilTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/upload/ImageUpload'
import GaleriaUpload from '@/components/upload/GaleriaUpload'

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
    descricao: string
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

  const toggleTipoCozinha = (id: number) => {
    const atuais = perfil.tipos_cozinha_ids || []
    if (atuais.includes(id)) {
      setPerfil({ ...perfil, tipos_cozinha_ids: atuais.filter(i => i !== id) })
    } else {
      setPerfil({ ...perfil, tipos_cozinha_ids: [...atuais, id] })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🏢 Perfil do Estabelecimento</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Dados Cadastrais</h3>
          {!editandoPerfil && (
            <button onClick={() => setEditandoPerfil(true)} className="text-blue-600 text-sm">✏️ Editar</button>
          )}
        </div>

        {editandoPerfil ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNPJ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={formatarCNPJ(perfil.cnpj)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 14)
                  setPerfil({ ...perfil, cnpj: raw })
                }}
                onBlur={() => onBuscarCnpj(perfil.cnpj)}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="00.000.000/0000-00"
              />
              {buscandoCnpj && <span className="text-xs text-gray-400">Buscando...</span>}
            </div>

            {/* Razão Social (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
              <input
                type="text"
                value={perfil.razao_social}
                readOnly
                className="border rounded-lg px-3 py-2 w-full bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={perfil.nome_fantasia}
                onChange={(e) => setPerfil({ ...perfil, nome_fantasia: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={perfil.endereco}
                onChange={(e) => setPerfil({ ...perfil, endereco: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                value={perfil.bairro}
                onChange={(e) => setPerfil({ ...perfil, bairro: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={aplicarMascaraCEP(perfil.cep)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setPerfil({ ...perfil, cep: raw })
                }}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="00000-000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={aplicarMascaraTelefone(perfil.telefone)}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, '')
                  if (raw.length > 11) raw = raw.slice(0, 11)
                  setPerfil({ ...perfil, telefone: raw })
                }}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="(71) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={aplicarMascaraTelefone(perfil.whatsapp)}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\D/g, '')
                  if (raw.length > 11) raw = raw.slice(0, 11)
                  setPerfil({ ...perfil, whatsapp: raw })
                }}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="(71) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input
                type="text"
                value={perfil.instagram}
                onChange={(e) => setPerfil({ ...perfil, instagram: e.target.value.replace('@', '') })}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="@seudominio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                defaultValue={perfil.latitude !== null && perfil.latitude !== undefined ? perfil.latitude.toString().replace('.', ',') : ''}
                onBlur={(e) => {
                  let raw = e.target.value.trim()
                  if (raw === '') {
                    setPerfil({ ...perfil, latitude: null })
                    return
                  }
                  let num = parseFloat(raw.replace(',', '.'))
                  if (!isNaN(num) && num >= -90 && num <= 90) {
                    setPerfil({ ...perfil, latitude: num })
                  } else {
                    e.target.value = perfil.latitude !== null ? perfil.latitude.toString().replace('.', ',') : ''
                  }
                }}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="Ex: -12,98 ou 0"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                defaultValue={perfil.longitude !== null && perfil.longitude !== undefined ? perfil.longitude.toString().replace('.', ',') : ''}
                onBlur={(e) => {
                  let raw = e.target.value.trim()
                  if (raw === '') {
                    setPerfil({ ...perfil, longitude: null })
                    return
                  }
                  let num = parseFloat(raw.replace(',', '.'))
                  if (!isNaN(num) && num >= -180 && num <= 180) {
                    setPerfil({ ...perfil, longitude: num })
                  } else {
                    e.target.value = perfil.longitude !== null ? perfil.longitude.toString().replace('.', ',') : ''
                  }
                }}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="Ex: -38,4657 ou 0"
              />
            </div>

            {/* Tipos de Cozinha (múltipla escolha) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de Cozinha (pode escolher vários)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tiposCozinhaDisponiveis.map((tipo) => {
                  const isChecked = (perfil.tipos_cozinha_ids || []).includes(tipo.id)
                  return (
                    <label key={tipo.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTipoCozinha(tipo.id)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-800">{tipo.nome}</span>
                    </label>
                  )
                })}
              </div>
              {tiposCozinhaDisponiveis.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Nenhum tipo de cozinha cadastrado. Entre em contato com o administrador.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={perfil.descricao}
                onChange={(e) => setPerfil({ ...perfil, descricao: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full"
                rows={4}
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={onSalvarPerfil}
                disabled={salvandoPerfil}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                {salvandoPerfil ? 'Salvando...' : '💾 Salvar Perfil'}
              </button>
              <button
                onClick={() => setEditandoPerfil(false)}
                className="border px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          // Modo visualização
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
                      <span key={tipo.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {tipo.nome}
                      </span>
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
            <div className="col-span-2">
              <span className="text-gray-500">Descrição:</span>
              <p className="font-medium whitespace-pre-wrap">{perfil.descricao}</p>
            </div>
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