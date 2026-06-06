// src/app/painel/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { ImageUpload } from '@/components/upload/ImageUpload'
import GaleriaUpload from '@/components/upload/GaleriaUpload'

const TEMAS_PADRAO = ['raiz-brasileira']

// ----------------------------------------------------------------
// Componente DashboardMetrics (cards)
// ----------------------------------------------------------------
function DashboardMetrics({ estabelecimento, categorias, limitePlano }: any) {
  const publicados = categorias.reduce((total: number, cat: any) => {
    const itens = cat.itens_cardapio || [];
    return total + itens.filter((i: any) => i.disponivel).length;
  }, 0);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Scans QR Code</p>
        <p className="text-3xl font-bold text-blue-600">{estabelecimento?.scans_qrcode || 0}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Itens Publicados</p>
        <p className="text-3xl font-bold text-orange-600">{publicados} <span className="text-lg text-gray-400">/ {limitePlano}</span></p>
        {publicados >= limitePlano && <p className="text-xs text-red-500 mt-1">Limite atingido. Faça upgrade.</p>}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Categorias</p>
        <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Componente RecursosList (para o Dashboard)
// ----------------------------------------------------------------
function RecursosList({ recursosDisponiveis, recursosAtivos, recursosPermitidos, toggleRecurso }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-lg mb-4">🧩 Recursos Ativos</h3>
      <p className="text-sm text-gray-500 mb-4">Ative ou desative funcionalidades que aparecerão no seu menu digital.</p>
      <div className="space-y-3">
        {recursosDisponiveis.map((recurso: any) => {
          const permitido = recursosPermitidos.includes(recurso.slug);
          const ativo = recursosAtivos.includes(recurso.slug);
          return (
            <div key={recurso.slug} className={`p-4 rounded-xl border-2 ${ativo ? 'border-green-500 bg-green-50' : 'border-gray-200'} ${!permitido ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{recurso.nome}</p>
                  <p className="text-xs text-gray-500">{recurso.descricao}</p>
                </div>
                <button
                  disabled={!permitido}
                  onClick={() => toggleRecurso(recurso.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${!permitido ? 'cursor-not-allowed' : ''}`}
                >
                  {ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
              {!permitido && <p className="text-xs text-red-500 mt-2">🔒 Não disponível no seu plano</p>}
            </div>
          );
        })}
      </div>
      <Link href="/planos" className="mt-6 inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200">
        ⬆️ Fazer Upgrade
      </Link>
    </div>
  )
}

// ----------------------------------------------------------------
// Componente ItemRow (reutilizável, com código em fonte maior)
// ----------------------------------------------------------------
function ItemRow({ item, modeloVisual, onEditarItem, onExcluirItem, onTogglePromocao, onPublicarItem, limitePlano, publicados }: any) {
  const promocao = item.promocao_ativa && item.preco_promocional
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
  const codigoElem = item.codigo ? <span className="font-bold text-lg text-gray-800">{item.codigo}</span> : null

  return (
    <div className={`p-3 md:p-4 hover:bg-gray-50 transition ${promocao ? 'bg-green-50 border-l-4 border-green-500' : item.disponivel ? '' : 'bg-gray-100 border-l-4 border-gray-300'}`}>
      {/* SEM FOTO */}
      {modeloVisual === 'sem-foto' && (
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {codigoElem}
              <span className="font-medium text-gray-800">- {item.nome}</span>
              {promocao && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>}
              {!item.disponivel && <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>}
            </div>
            {item.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descricao}</p>}
            {item.tags && item.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{item.tags.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-1.5 py-0.5 rounded-full">{tag}</span>)}</div>}
          </div>
          <div className="text-right">
            {promocao ? (<><div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div><div className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</div></>) : (<div className="font-bold text-gray-900">R$ {fmt(item.preco)}</div>)}
          </div>
        </div>
      )}
      {/* FOTO ESQUERDA */}
      {modeloVisual === 'foto-esquerda' && (
        <div className="flex gap-3">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
            {item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {codigoElem}
              <span className="font-medium text-gray-800 truncate">- {item.nome}</span>
              {promocao && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>}
              {!item.disponivel && <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>}
            </div>
            {item.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descricao}</p>}
            <div className="flex items-center gap-2 mt-2">
              {promocao ? (<><span className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</span><span className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</span>{item.desconto_percentual && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">-{item.desconto_percentual}%</span>}</>) : (<span className="font-bold text-gray-900">R$ {fmt(item.preco)}</span>)}
              {item.tags && item.tags.length > 0 && <div className="flex flex-wrap gap-1">{item.tags.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-1.5 py-0.5 rounded-full">{tag}</span>)}</div>}
            </div>
          </div>
        </div>
      )}
      {/* FOTO TOPO */}
      {modeloVisual === 'foto-topo' && (
        <div>
          {item.foto_url && <div className="w-full h-32 md:h-40 mb-2 rounded-lg overflow-hidden bg-gray-200"><img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /></div>}
          <div className="flex items-center gap-2 flex-wrap">
            {codigoElem}
            <span className="font-medium text-gray-800">- {item.nome}</span>
            {promocao && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>}
            {!item.disponivel && <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>}
          </div>
          {item.descricao && <p className="text-xs text-gray-500 mt-1">{item.descricao}</p>}
          <div className="flex items-center gap-2 mt-1">
            {promocao ? (<><span className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</span><span className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</span></>) : (<span className="font-bold text-gray-900">R$ {fmt(item.preco)}</span>)}
          </div>
        </div>
      )}
      {/* Botões de ação */}
      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-gray-100">
        <button onClick={() => onEditarItem(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">✏️</button>
        <button onClick={() => onExcluirItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
        <button onClick={() => onTogglePromocao(item.id, item.promocao_ativa)} className={`p-1.5 rounded-lg ${promocao ? 'text-green-600 hover:bg-green-50' : 'text-purple-500 hover:bg-purple-50'}`}>🎉</button>
        <button onClick={() => onPublicarItem(item.id, item.disponivel)} disabled={!item.disponivel && publicados >= limitePlano} className={`p-1.5 rounded-lg ${item.disponivel ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>{item.disponivel ? '👁️' : '👁️‍🗨️'}</button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// ListaCategorias (com promoções automáticas)
// ----------------------------------------------------------------
function ListaCategorias({ categorias, onAdicionarItem, onEditarItem, onPublicarItem, onExcluirItem, onTogglePromocao, limitePlano, modeloVisual }: any) {
  const publicados = categorias.reduce((t: number, c: any) => {
    const itens = c.itens_cardapio || [];
    return t + itens.filter((i: any) => i.disponivel).length;
  }, 0);
  const itensPromocao = categorias.flatMap((cat: any) => (cat.itens_cardapio || []).filter((item: any) => item.promocao_ativa && item.preco_promocional))
  const temPromocao = itensPromocao.length > 0

  return (
    <div className="space-y-4">
      {temPromocao && (
        <div className="bg-white rounded-xl border border-green-200">
          <div className="p-4 border-b bg-green-50"><h3 className="font-bold text-green-700">🎉 Promoções ({itensPromocao.length} itens)</h3></div>
          <div className="divide-y">{itensPromocao.map((item: any) => <ItemRow key={`promo-${item.id}`} item={item} modeloVisual={modeloVisual} onEditarItem={onEditarItem} onExcluirItem={onExcluirItem} onTogglePromocao={onTogglePromocao} onPublicarItem={onPublicarItem} limitePlano={limitePlano} publicados={publicados} />)}</div>
        </div>
      )}
      {categorias.map((cat: any) => {
        const itens = cat.itens_cardapio || []
        if (itens.length === 0) return null
        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b bg-gray-50 flex justify-between"><h3 className="font-bold">{cat.nome} ({itens.length} itens)</h3><button onClick={() => onAdicionarItem(cat.id)} className="text-orange-600 text-sm">+ Adicionar Item</button></div>
            <div className="divide-y">{itens.map((item: any) => <ItemRow key={item.id} item={item} modeloVisual={modeloVisual} onEditarItem={onEditarItem} onExcluirItem={onExcluirItem} onTogglePromocao={onTogglePromocao} onPublicarItem={onPublicarItem} limitePlano={limitePlano} publicados={publicados} />)}</div>
          </div>
        )
      })}
      {categorias.length === 0 && <div className="text-center py-12 text-gray-500">Nenhuma categoria cadastrada</div>}
    </div>
  )
}

// ----------------------------------------------------------------
// Componente GestaoPerfil (unificado, sem duplicações)
// ----------------------------------------------------------------
function GestaoPerfil({ estabelecimento, setEstabelecimento, planosList, limitePlano, limiteGaleria, usuario }: any) {
  const [perfil, setPerfil] = useState({
    nome: '',
    descricao: '',
    bairro: '',
    endereco: '',
    cep: '',
    telefone: '',
    whatsapp: '',
    email: '',
    instagram: ''
  })
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [whatsappMensagem, setWhatsappMensagem] = useState('')
  const [whatsappAtivo, setWhatsappAtivo] = useState(false)
  const [horarios, setHorarios] = useState<any[]>([])
  const DIAS_SEMANA = [{valor:0,nome:'Domingo'},{valor:1,nome:'Segunda'},{valor:2,nome:'Terça'},{valor:3,nome:'Quarta'},{valor:4,nome:'Quinta'},{valor:5,nome:'Sexta'},{valor:6,nome:'Sábado'}]

  useEffect(() => {
    if (estabelecimento) {
      setPerfil({
        nome: estabelecimento.nome || '',
        descricao: estabelecimento.descricao || '',
        bairro: estabelecimento.bairro || '',
        endereco: estabelecimento.endereco || '',
        cep: estabelecimento.cep || '',
        telefone: estabelecimento.telefone || '',
        whatsapp: estabelecimento.whatsapp || '',
        email: estabelecimento.email || '',
        instagram: estabelecimento.instagram || ''
      })
      setWhatsappMensagem(estabelecimento.whatsapp_config?.mensagem_padrao || 'Olá! Vim pelo cardápio digital.')
      setWhatsappAtivo(estabelecimento.whatsapp_config?.ativo ?? !!estabelecimento.whatsapp)
      carregarHorarios()
    }
  }, [estabelecimento])

  const carregarHorarios = async () => {
    if (!estabelecimento?.id) return;
    const { data } = await supabase.from('horarios_funcionamento').select('*').eq('estabelecimento_id', estabelecimento.id).order('dia_semana');
    const diasCompletos = DIAS_SEMANA.map(dia => {
      const encontrado = data?.find(h => h.dia_semana === dia.valor);
      return encontrado || { dia_semana: dia.valor, horario_abertura: '08:00', horario_fechamento: '18:00', fechado: false, estabelecimento_id: estabelecimento.id }
    });
    setHorarios(diasCompletos);
  };

  const salvarHorario = async (dia: any) => {
    await supabase.from('horarios_funcionamento').upsert({ estabelecimento_id: estabelecimento.id, dia_semana: dia.dia_semana, horario_abertura: dia.horario_abertura, horario_fechamento: dia.horario_fechamento, fechado: dia.fechado }, { onConflict: 'estabelecimento_id,dia_semana' })
  };

  const salvarPerfil = async () => {
    setSalvando(true);
    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        nome: perfil.nome,
        descricao: perfil.descricao,
        bairro: perfil.bairro,
        endereco: perfil.endereco,
        cep: perfil.cep,
        telefone: perfil.telefone,
        whatsapp: perfil.whatsapp,
        email: perfil.email,
        instagram: perfil.instagram
      })
      .eq('id', estabelecimento.id);
    if (error) {
      console.error(error);
      alert('Erro ao salvar perfil: ' + error.message);
    } else {
      await supabase
        .from('estabelecimentos')
        .update({
          whatsapp_config: { mensagem_padrao: whatsappMensagem, ativo: whatsappAtivo }
        })
        .eq('id', estabelecimento.id);
      setEstabelecimento({ ...estabelecimento, ...perfil, whatsapp_config: { mensagem_padrao: whatsappMensagem, ativo: whatsappAtivo } });
      alert('Perfil atualizado com sucesso!');
    }
    setEditando(false);
    setSalvando(false);
  };

  const salvarFotoCapa = async (url: string) => {
    await supabase.from('estabelecimentos').update({ foto_capa: url }).eq('id', estabelecimento.id);
    setEstabelecimento({ ...estabelecimento, foto_capa: url });
  };

  const salvarLogo = async (url: string) => {
    await supabase.from('estabelecimentos').update({ logo_url: url }).eq('id', estabelecimento.id);
    setEstabelecimento({ ...estabelecimento, logo_url: url });
  };

  const atualizarGaleria = async (urls: string[]) => {
    await supabase.from('estabelecimentos').update({ galeria_fotos: urls }).eq('id', estabelecimento.id);
    setEstabelecimento({ ...estabelecimento, galeria_fotos: urls });
  };

  return (
    <div className="space-y-8">
      {/* Perfil completo */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">📝 Perfil do Estabelecimento</h3>{!editando && <button onClick={() => setEditando(true)} className="text-blue-600 text-sm">✏️ Editar</button>}</div>
        {editando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Nome" />
            <input type="text" value={perfil.endereco} onChange={e => setPerfil({...perfil, endereco: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Endereço" />
            <input type="text" value={perfil.bairro} onChange={e => setPerfil({...perfil, bairro: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Bairro" />
            <input type="text" value={perfil.cep} onChange={e => setPerfil({...perfil, cep: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="CEP" />
            <input type="text" value={perfil.telefone} onChange={e => setPerfil({...perfil, telefone: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Telefone" />
            <input type="text" value={perfil.whatsapp} onChange={e => setPerfil({...perfil, whatsapp: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="WhatsApp" />
            <input type="text" value={perfil.instagram} onChange={e => setPerfil({...perfil, instagram: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Instagram" />
            <input type="email" value={perfil.email} onChange={e => setPerfil({...perfil, email: e.target.value})} className="border rounded-lg px-3 py-2" placeholder="Email" />
            <textarea value={perfil.descricao} onChange={e => setPerfil({...perfil, descricao: e.target.value})} className="border rounded-lg px-3 py-2 col-span-2" rows={3} placeholder="Descrição" />
            <div className="col-span-2 flex gap-3"><button onClick={salvarPerfil} disabled={salvando} className="bg-orange-600 text-white px-4 py-2 rounded-lg">{salvando ? 'Salvando...' : '💾 Salvar'}</button><button onClick={() => setEditando(false)} className="border px-4 py-2 rounded-lg">Cancelar</button></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Nome:</span> <p className="font-medium">{perfil.nome}</p></div>
            <div><span className="text-gray-500">Endereço:</span> <p className="font-medium">{perfil.endereco}</p></div>
            <div><span className="text-gray-500">Bairro:</span> <p className="font-medium">{perfil.bairro}</p></div>
            <div><span className="text-gray-500">CEP:</span> <p className="font-medium">{perfil.cep}</p></div>
            <div><span className="text-gray-500">Telefone:</span> <p className="font-medium">{perfil.telefone}</p></div>
            <div><span className="text-gray-500">WhatsApp:</span> <p className="font-medium">{perfil.whatsapp}</p></div>
            <div><span className="text-gray-500">Instagram:</span> <p className="font-medium">{perfil.instagram}</p></div>
            <div><span className="text-gray-500">Email:</span> <p className="font-medium">{perfil.email}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Descrição:</span> <p className="font-medium">{perfil.descricao}</p></div>
          </div>
        )}
      </div>

      {/* Imagens */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🖼️ Imagens</h3>
        <div className="space-y-6">
          <div><h4 className="font-medium mb-2">Foto de Capa</h4><ImageUpload onUpload={salvarFotoCapa} defaultImage={estabelecimento?.foto_capa || ''} /></div>
          <div>
            <h4 className="font-medium mb-2">Logo do Estabelecimento</h4>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {estabelecimento?.logo_url && (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
                  <img src={estabelecimento.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <ImageUpload onUpload={salvarLogo} defaultImage={estabelecimento?.logo_url || ''} />
                <p className="text-xs text-gray-400 mt-1">Recomendado: imagem quadrada, no mínimo 200x200px.</p>
              </div>
            </div>
          </div>
          <div><h4 className="font-medium mb-2">Galeria de Fotos (até {limiteGaleria} imagens)</h4><GaleriaUpload imagensIniciais={estabelecimento?.galeria_fotos || []} limite={limiteGaleria} onUpdate={atualizarGaleria} /></div>
        </div>
      </div>

      {/* Horários */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🕒 Horários de Funcionamento</h3>
        <div className="space-y-3">
          {horarios.map((dia, idx) => (
            <div key={dia.dia_semana} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-24 font-medium">{DIAS_SEMANA[idx].nome}</span>
              <label className="flex items-center gap-1"><input type="checkbox" checked={dia.fechado} onChange={(e) => { const novos = [...horarios]; novos[idx].fechado = e.target.checked; setHorarios(novos); salvarHorario(novos[idx]) }} /><span className="text-xs">Fechado</span></label>
              {!dia.fechado && (
                <div className="flex items-center gap-2">
                  <input type="time" value={dia.horario_abertura?.substring(0,5)} onChange={(e) => { const novos = [...horarios]; novos[idx].horario_abertura = e.target.value; setHorarios(novos); salvarHorario(novos[idx]) }} className="border rounded px-2 py-1 w-28" />
                  <span>às</span>
                  <input type="time" value={dia.horario_fechamento?.substring(0,5)} onChange={(e) => { const novos = [...horarios]; novos[idx].horario_fechamento = e.target.value; setHorarios(novos); salvarHorario(novos[idx]) }} className="border rounded px-2 py-1 w-28" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">💬 Configurações do WhatsApp</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mensagem padrão</label>
            <input type="text" value={whatsappMensagem} onChange={e => setWhatsappMensagem(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={whatsappAtivo} onChange={e => setWhatsappAtivo(e.target.checked)} /><span>Ativar botão no menu</span></label>
            <button onClick={async () => {
              await supabase.from('estabelecimentos').update({ whatsapp_config: { mensagem_padrao: whatsappMensagem, ativo: whatsappAtivo } }).eq('id', estabelecimento.id);
              alert('Configurações do WhatsApp salvas!');
            }} className="bg-green-600 text-white px-4 py-2 rounded-lg">💾 Salvar Configurações</button>
          </div>
        </div>
      </div>

      {/* Conta */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">👤 Conta</h3>
        <p className="text-sm"><span className="text-gray-500">Email:</span> {usuario?.email}</p>
        <button className="text-blue-600 text-sm mt-2">Alterar senha</button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Componente principal PainelDono
// ----------------------------------------------------------------
export default function PainelDono() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [menuAberto, setMenuAberto] = useState(false)
  const [modeloVisual, setModeloVisual] = useState<'sem-foto' | 'foto-esquerda' | 'foto-topo'>('foto-esquerda')
  const [temaSelecionado, setTemaSelecionado] = useState('raiz-brasileira')
  const [temasDisponiveis, setTemasDisponiveis] = useState<any[]>([])
  const [temasPermitidos, setTemasPermitidos] = useState<string[]>(TEMAS_PADRAO)
  const [limitePlano, setLimitePlano] = useState(15)
  const [limiteGaleria, setLimiteGaleria] = useState(1)
  const [modelosQRDisponiveis, setModelosQRDisponiveis] = useState<any[]>([])
  const [modelosQRPermitidos, setModelosQRPermitidos] = useState<string[]>([])
  const [modeloQRSelecionado, setModeloQRSelecionado] = useState('classico')
  const [recursosAtivos, setRecursosAtivos] = useState<string[]>([])
  const [recursosPermitidos, setRecursosPermitidos] = useState<string[]>([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState<any[]>([])
  const [planosList, setPlanosList] = useState<any[]>([])

  // Modal states
  const [mostrarModal, setMostrarModal] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [itemEditandoId, setItemEditandoId] = useState<string | null>(null)
  const [formItem, setFormItem] = useState({ nome: '', descricao: '', preco: '', preco_promocional: '', promocao_ativa: false, promocao_titulo: '', desconto_percentual: '', disponivel: false, codigo: '', tags: '', foto_url: '', delivery_disponivel: false })
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  // Funções de persistência
  const salvarLayoutCardapio = async (layout: string) => {
    if (!estabelecimento) return
    const { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabelecimento.id).eq('ativo', true).single()
    if (menu) await supabase.from('menus').update({ layout_cardapio: layout }).eq('id', menu.id)
  }

  const carregarLayoutSalvo = async (estabId: string) => {
    const { data: menu } = await supabase.from('menus').select('layout_cardapio, tema').eq('estabelecimento_id', estabId).eq('ativo', true).single()
    if (menu?.layout_cardapio) setModeloVisual(menu.layout_cardapio)
    if (menu?.tema) setTemaSelecionado(menu.tema)
  }

  const alterarTema = async (slug: string) => {
    if (!estabelecimento) return
    await supabase.from('menus').update({ tema: slug }).eq('estabelecimento_id', estabelecimento.id)
    setTemaSelecionado(slug)
  }

  const carregarEstabelecimento = async (id: string) => {
    const { data } = await supabase.from('estabelecimentos').select('*').eq('id', id).single()
    if (data) {
      setEstabelecimento(data)
      await carregarLayoutSalvo(data.id)
      await carregarCardapio(data.id)
      await carregarTemasEPlano(data.id, data.plano_id)
      await carregarModelosQR(data.id, data.plano_id)
      await carregarRecursos(data.id, data.plano_id)
    }
  }

  const carregarCardapio = useCallback(async (estabId: string) => {
    const { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabId).eq('ativo', true).single()
    if (menu) {
      const { data: cats } = await supabase.from('categorias').select('*, itens_cardapio(*)').eq('menu_id', menu.id).order('ordem')
      if (cats) setCategorias(cats)
    }
  }, [])

  const carregarTemasEPlano = async (estabId: string, planoId?: string) => {
    let idPlano = planoId;
    if (!idPlano) {
      const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = e?.plano_id
    }
    if (idPlano) {
      const { data: plano } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos, limite_galeria').eq('id', idPlano).single()
      if (plano) {
        setTemasPermitidos(plano.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(plano.limite_itens || 15)
        setRecursosPermitidos(plano.recursos_permitidos || [])
        setLimiteGaleria(plano.limite_galeria || 1)
      }
    } else {
      const { data: pg } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos, limite_galeria').eq('slug', 'gratis').single()
      if (pg) {
        setTemasPermitidos(pg.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(pg.limite_itens || 15)
        setRecursosPermitidos(pg.recursos_permitidos || [])
        setLimiteGaleria(pg.limite_galeria || 1)
      }
    }
    const { data: todos } = await supabase.from('temas').select('*')
    if (todos) setTemasDisponiveis(todos)
  }

  const carregarModelosQR = async (estabId: string, planoId?: string) => {
    let idPlano = planoId;
    if (!idPlano) {
      const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = e?.plano_id
    }
    if (idPlano) {
      const { data: p } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('id', idPlano).single()
      if (p) setModelosQRPermitidos(p.modelos_qrcode_permitidos || [])
    } else {
      const { data: pg } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('slug', 'gratis').single()
      if (pg) setModelosQRPermitidos(pg.modelos_qrcode_permitidos || [])
    }
    const { data: todos } = await supabase.from('modelos_qrcode').select('*')
    if (todos) setModelosQRDisponiveis(todos)
    if (estabId) {
      const { data: e } = await supabase.from('estabelecimentos').select('qrcode_modelo').eq('id', estabId).single()
      if (e?.qrcode_modelo) setModeloQRSelecionado(e.qrcode_modelo)
    }
  }

  const carregarRecursos = async (estabId: string, planoId?: string) => {
    const { data: estab } = await supabase.from('estabelecimentos').select('recursos_ativos').eq('id', estabId).single()
    if (estab?.recursos_ativos && estab.recursos_ativos.length > 0) {
      setRecursosAtivos(estab.recursos_ativos)
    } else {
      const { data: plano } = await supabase.from('planos').select('recursos_permitidos').eq('id', planoId).single()
      const padrao = plano?.recursos_permitidos || []
      setRecursosAtivos(padrao)
      await supabase.from('estabelecimentos').update({ recursos_ativos: padrao }).eq('id', estabId)
    }
    if (!recursosPermitidos.length && planoId) {
      const { data: plano } = await supabase.from('planos').select('recursos_permitidos').eq('id', planoId).single()
      if (plano) setRecursosPermitidos(plano.recursos_permitidos || [])
    }
  }

  const toggleRecurso = async (slug: string) => {
    const novos = recursosAtivos.includes(slug) ? recursosAtivos.filter(r => r !== slug) : [...recursosAtivos, slug]
    await supabase.from('estabelecimentos').update({ recursos_ativos: novos }).eq('id', estabelecimento.id)
    setRecursosAtivos(novos)
  }

  const alterarModeloQR = async (slug: string) => {
    if (!estabelecimento) return
    await supabase.from('estabelecimentos').update({ qrcode_modelo: slug }).eq('id', estabelecimento.id)
    setModeloQRSelecionado(slug)
  }

  const publicarItem = async (itemId: string, disponivel: boolean) => {
    if (!disponivel) {
      const publicados = categorias.reduce((t: number, c: any) => {
        const itens = c.itens_cardapio || [];
        return t + itens.filter((i: any) => i.disponivel).length;
      }, 0);
      if (publicados >= limitePlano) { alert(`Limite de ${limitePlano} itens. Faça upgrade.`); return }
    }
    await supabase.from('itens_cardapio').update({ disponivel: !disponivel }).eq('id', itemId)
    carregarCardapio(estabelecimento.id)
  }

  const excluirItem = async (id: string) => { if (confirm('Excluir?')) { await supabase.from('itens_cardapio').delete().eq('id', id); carregarCardapio(estabelecimento.id) } }

  const abrirEdicao = (item: any) => {
    setFormItem({
      nome: item.nome, descricao: item.descricao || '', preco: item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '',
      preco_promocional: item.preco_promocional?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '',
      promocao_ativa: item.promocao_ativa, promocao_titulo: item.promocao_titulo || '', desconto_percentual: item.desconto_percentual?.toString() || '',
      disponivel: item.disponivel, codigo: item.codigo || '', tags: item.tags?.join(', ') || '', foto_url: item.foto_url || '', delivery_disponivel: item.delivery_disponivel || false
    })
    setCategoriaSelecionada(item.categoria_id); setItemEditandoId(item.id); setModoEdicao(true); setMostrarModal(true)
  }

  const togglePromocao = async (itemId: string, ativa: boolean) => {
    await supabase.from('itens_cardapio').update({ promocao_ativa: !ativa }).eq('id', itemId);
    carregarCardapio(estabelecimento.id);
  };

  const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaSelecionada || !formItem.nome || !formItem.preco) { alert('Preencha nome e preço!'); return }
    const tagsArray = formItem.tags ? formItem.tags.split(',').map(t => t.trim()) : []
    const dados = {
      categoria_id: categoriaSelecionada, nome: formItem.nome, descricao: formItem.descricao,
      preco: parseFloat(formItem.preco.replace(',', '.')),
      preco_promocional: formItem.preco_promocional ? parseFloat(formItem.preco_promocional.replace(',', '.')) : null,
      promocao_ativa: formItem.promocao_ativa, promocao_titulo: formItem.promocao_titulo || null,
      desconto_percentual: formItem.desconto_percentual ? parseInt(formItem.desconto_percentual) : null,
      disponivel: formItem.disponivel, codigo: formItem.codigo || null, tags: tagsArray,
      foto_url: formItem.foto_url || null, delivery_disponivel: formItem.delivery_disponivel
    }
    const { error } = modoEdicao && itemEditandoId ?
      await supabase.from('itens_cardapio').update(dados).eq('id', itemEditandoId) :
      await supabase.from('itens_cardapio').insert(dados)
    if (error) alert('Erro: ' + error.message)
    else { setMostrarModal(false); limparForm(); carregarCardapio(estabelecimento.id) }
  }

  const criarCategoria = async () => {
    if (!novaCategoria || !estabelecimento) return
    let { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabelecimento.id).eq('ativo', true).single()
    if (!menu) {
      const { data: novoMenu, error: erroMenu } = await supabase
        .from('menus')
        .insert({ estabelecimento_id: estabelecimento.id, nome: 'Cardápio Principal', tema: 'raiz-brasileira', ativo: true })
        .select('id')
        .single()
      if (erroMenu || !novoMenu) {
        alert('Erro ao criar menu: ' + erroMenu?.message)
        return
      }
      menu = novoMenu
    }
    await supabase.from('categorias').insert({ menu_id: menu.id, nome: novaCategoria, ordem: categorias.length })
    setNovaCategoria('')
    setMostrarNovaCategoria(false)
    carregarCardapio(estabelecimento.id)
  }

  const limparForm = () => { setFormItem({ nome: '', descricao: '', preco: '', preco_promocional: '', promocao_ativa: false, promocao_titulo: '', desconto_percentual: '', disponivel: false, codigo: '', tags: '', foto_url: '', delivery_disponivel: false }); setCategoriaSelecionada(''); setModoEdicao(false); setItemEditandoId(null) }

  const sair = () => { localStorage.removeItem('usuario'); router.push('/login') }

  useEffect(() => {
    const userData = localStorage.getItem('usuario')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    setUsuario(user)
    if (user.estabelecimento_id) carregarEstabelecimento(user.estabelecimento_id)
    else if (user.estabelecimentos?.id) carregarEstabelecimento(user.estabelecimentos.id)
    else router.push('/login')
    setLoading(false)
  }, [])

  useEffect(() => { supabase.from('planos').select('*').then(({ data }) => setPlanosList(data || [])); supabase.from('recursos_menu').select('*').then(({ data }) => setRecursosDisponiveis(data || [])) }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!usuario) return null

  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'cardapio', icon: '📋', label: 'Meu Cardápio' },
    { key: 'qrcode', icon: '📱', label: 'QR Code' },
    { key: 'perfil', icon: '⚙️', label: 'Gestão do Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuAberto(!menuAberto)} className="md:hidden text-2xl">☰</button>
          <span className="text-2xl">🏪</span>
          <div><h1 className="text-lg md:text-xl font-bold">{estabelecimento?.nome || 'Meu Estabelecimento'}</h1><p className="text-xs md:text-sm text-gray-600">Olá, {usuario.nome}!</p></div>
        </div>
        <div className="flex items-center gap-3">
          {estabelecimento?.qrcode_short_url && <Link href={`/menu/${estabelecimento.qrcode_short_url}`} target="_blank" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">👁️ Ver</Link>}
          <button onClick={sair} className="text-red-600 text-sm">Sair</button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed top-0 left-0 z-50 w-60 bg-white min-h-screen shadow-lg transition-transform duration-300 md:relative md:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex justify-between items-center md:hidden"><span className="font-bold">Menu</span><button onClick={() => setMenuAberto(false)} className="text-2xl">✕</button></div>
          <nav className="p-4 space-y-1">
            {navItems.map(aba => (
              <button key={aba.key} onClick={() => { setAbaAtiva(aba.key); setMenuAberto(false) }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>{aba.icon} {aba.label}</button>
            ))}
          </nav>
        </aside>
        {menuAberto && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuAberto(false)} />}

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {abaAtiva === 'dashboard' && (
            <>
              <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>
              <DashboardMetrics estabelecimento={estabelecimento} categorias={categorias} limitePlano={limitePlano} />
              <RecursosList recursosDisponiveis={recursosDisponiveis} recursosAtivos={recursosAtivos} recursosPermitidos={recursosPermitidos} toggleRecurso={toggleRecurso} />
            </>
          )}
          {abaAtiva === 'cardapio' && (
            <div>
              <div className="flex flex-wrap justify-between gap-2 mb-6">
                <h2 className="text-2xl font-bold">📋 Meu Cardápio</h2>
                <div className="flex gap-2">
                  <select value={modeloVisual} onChange={async (e) => { const novo = e.target.value as any; setModeloVisual(novo); await salvarLayoutCardapio(novo); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="sem-foto">📄 Sem foto</option>
                    <option value="foto-esquerda">📷 Foto à esquerda</option>
                    <option value="foto-topo">📷 Foto no topo</option>
                  </select>
                  <select value={temaSelecionado} onChange={async (e) => { await alterarTema(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
                    {temasDisponiveis.filter(t => temasPermitidos.includes(t.slug)).map(tema => <option key={tema.slug} value={tema.slug}>🎨 {tema.nome}</option>)}
                  </select>
                  <button onClick={() => setMostrarNovaCategoria(true)} className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">➕ Nova Categoria</button>
                </div>
              </div>
              <ListaCategorias
                categorias={categorias}
                onAdicionarItem={(catId: string) => { setCategoriaSelecionada(catId); setModoEdicao(false); setMostrarModal(true) }}
                onEditarItem={abrirEdicao}
                onPublicarItem={publicarItem}
                onExcluirItem={excluirItem}
                onTogglePromocao={togglePromocao}
                limitePlano={limitePlano}
                modeloVisual={modeloVisual}
              />
            </div>
          )}
          {abaAtiva === 'qrcode' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📱 QR Code</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Estilo do QR Code</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {modelosQRDisponiveis.map(modelo => {
                    const permitido = modelosQRPermitidos.includes(modelo.slug);
                    const ativo = modeloQRSelecionado === modelo.slug;
                    return <button key={modelo.slug} disabled={!permitido} onClick={() => alterarModeloQR(modelo.slug)} className={`p-4 rounded-xl border-2 ${ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200'} ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div className="flex gap-1 mb-2"><div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_frente }} /><div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_fundo, border: '1px solid #ddd' }} /></div>
                      <p className="font-semibold">{modelo.nome}</p>
                      {!permitido && <span className="text-xs text-red-500">🔒 Plano superior</span>}
                    </button>
                  })}
                </div>
                {estabelecimento?.qrcode_short_url && (
                  <div className="flex flex-col items-center">
                    <div style={{ background: modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_fundo || '#FFFFFF', padding: '1rem', borderRadius: '1rem' }}>
                      <QRCode value={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/menu/${estabelecimento.qrcode_short_url}`} size={200} bgColor={modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_fundo || '#FFFFFF'} fgColor={modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_frente || '#000000'} level="H" />
                    </div>
                    <p className="mt-4 text-sm text-gray-600">menu.salvador.br/menu/{estabelecimento.qrcode_short_url}</p>
                    <button onClick={() => { navigator.clipboard.writeText(`menu.salvador.br/menu/${estabelecimento.qrcode_short_url}`); alert('Link copiado!') }} className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg">📋 Copiar Link</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {abaAtiva === 'perfil' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">⚙️ Gestão do Perfil</h2>
              <GestaoPerfil estabelecimento={estabelecimento} setEstabelecimento={setEstabelecimento} planosList={planosList} limitePlano={limitePlano} limiteGaleria={limiteGaleria} usuario={usuario} />
            </div>
          )}
        </main>
      </div>

      {/* Modal de item */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{modoEdicao ? '✏️ Editar Item' : '➕ Novo Item'}</h3>
            <form onSubmit={salvarItem} className="space-y-4">
              <select required className="w-full border rounded-lg px-3 py-2" value={categoriaSelecionada} onChange={e => setCategoriaSelecionada(e.target.value)}><option value="">Selecione categoria</option>{categorias.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select>
              <input type="text" placeholder="Código (ex: A10)" value={formItem.codigo} onChange={e => setFormItem({...formItem, codigo: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Nome *" required value={formItem.nome} onChange={e => setFormItem({...formItem, nome: e.target.value})} className="border rounded-lg px-3 py-2" /><input type="text" placeholder="Preço (R$) *" value={formItem.preco} onChange={e => setFormItem({...formItem, preco: e.target.value})} className="border rounded-lg px-3 py-2" /></div>
              <textarea placeholder="Descrição" rows={2} value={formItem.descricao} onChange={e => setFormItem({...formItem, descricao: e.target.value})} className="border rounded-lg px-3 py-2" />
              <ImageUpload onUpload={(url) => setFormItem({...formItem, foto_url: url})} defaultImage={formItem.foto_url} />
              <div className="bg-purple-50 p-4 rounded-lg"><label><input type="checkbox" checked={formItem.promocao_ativa} onChange={e => setFormItem({...formItem, promocao_ativa: e.target.checked})} /> Ativar promoção</label>{formItem.promocao_ativa && <input type="text" placeholder="Preço promocional" value={formItem.preco_promocional} onChange={e => setFormItem({...formItem, preco_promocional: e.target.value})} className="w-full border rounded px-3 py-2 mt-2" />}</div>
              <div className="flex gap-3"><button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg">Salvar</button><button type="button" onClick={() => { setMostrarModal(false); limparForm() }} className="border px-4 py-2 rounded-lg">Cancelar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {mostrarNovaCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="font-bold text-lg mb-4">Nova Categoria</h3><input type="text" className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Nome" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} /><div className="flex gap-3"><button onClick={criarCategoria} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Criar</button><button onClick={() => setMostrarNovaCategoria(false)} className="border px-4 py-2 rounded-lg">Cancelar</button></div></div>
        </div>
      )}
    </div>
  );
}