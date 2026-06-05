'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ImageUpload } from '@/components/upload/ImageUpload'

// ----------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------

function LoginForm({ onLogin }: { onLogin: (senha: string) => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (senha === 'admin123') {
      onLogin(senha)
    } else {
      setErro('Senha incorreta!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
          <p className="text-gray-600 text-sm mt-1">menu.salvador.br</p>
        </div>
        <input
          type="password"
          placeholder="Digite a senha..."
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 mb-4"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro('') }}
        />
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}
        <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700">
          Entrar
        </button>
      </form>
    </div>
  )
}

function DashboardCards({ stats }: { stats: { total: number; ativos: number; inativos: number; scans: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Total', value: stats.total, color: '' },
        { label: 'Ativos', value: stats.ativos, color: 'text-green-600' },
        { label: 'Inativos', value: stats.inativos, color: 'text-red-600' },
        { label: 'Scans QR', value: stats.scans, color: 'text-blue-600' },
      ].map((item) => (
        <div key={item.label} className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">{item.label}</p>
          <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function TabelaDistribuicao({ estabelecimentos }: { estabelecimentos: any[] }) {
  const tipos = [
    { chave: 'restaurante', nome: 'Restaurantes' },
    { chave: 'bar', nome: 'Bares' },
    { chave: 'cafeteria', nome: 'Cafeterias' },
    { chave: 'banca_acaraje', nome: 'Bancas de Acarajé' },
    { chave: 'foodtruck', nome: 'Food Trucks' },
    { chave: 'lanchonete', nome: 'Lanchonetes' },
  ];

  const bairrosStats: Record<string, Record<string, number>> = {};
  estabelecimentos.forEach((est) => {
    const bairro = est.bairro || 'Outros';
    const tipo = est.tipo_estabelecimento || 'outro';
    if (!bairrosStats[bairro]) bairrosStats[bairro] = {};
    bairrosStats[bairro][tipo] = (bairrosStats[bairro][tipo] || 0) + 1;
    bairrosStats[bairro]._total = (bairrosStats[bairro]._total || 0) + 1;
  });

  const bairrosArray = Object.entries(bairrosStats)
    .sort(([, a], [, b]) => (b._total || 0) - (a._total || 0))
    .slice(0, 10);

  const totalGeral = estabelecimentos.length;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto mt-6">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">📊 Distribuição por Bairro e Tipo</h2>
        <p className="text-sm text-gray-500">Total geral: {totalGeral} estabelecimentos</p>
      </div>
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 text-sm">Bairro</th>
            <th className="text-left p-3 text-sm">Total</th>
            {tipos.map((t) => (
              <th key={t.chave} className="text-left p-3 text-sm">{t.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bairrosArray.map(([bairro, stats]) => (
            <tr key={bairro} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{bairro}</td>
              <td className="p-3">{stats._total || 0}</td>
              {tipos.map((t) => (
                <td key={t.chave} className="p-3">{stats[t.chave] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaEstabelecimentos({
  estabelecimentos,
  onToggleStatus,
  onToggleDestaque,
  onExcluir,
  onEditarEstabelecimento,
  planos,
  ordenacao,
  onOrdenar,
}: {
  estabelecimentos: any[]
  onToggleStatus: (id: string, ativo: boolean) => void
  onToggleDestaque: (id: string, destaque: boolean) => void
  onExcluir: (id: string, nome: string) => void
  onEditarEstabelecimento: (est: any) => void
  planos: any[]
  ordenacao: { coluna: string | null; direcao: 'asc' | 'desc' }
  onOrdenar: (coluna: string) => void
}) {
  const colunas = [
    { chave: 'nome', label: 'Nome' },
    { chave: 'bairro', label: 'Bairro' },
    { chave: 'tipo_cozinha', label: 'Tipo' },
    { chave: 'plano_id', label: 'Plano' },
    { chave: 'qrcode_short_url', label: 'QR Code' },
    { chave: 'scans_qrcode', label: 'Scans' },
    { chave: 'ativo', label: 'Status' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50">
          <tr>
            {colunas.map((col) => (
              <th
                key={col.chave}
                className="text-left p-4 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => onOrdenar(col.chave)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {ordenacao.coluna === col.chave && (
                    <span className="text-orange-500">
                      {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {estabelecimentos.map((est) => {
            const nomePlano = planos.find(p => p.id === est.plano_id)?.nome || 'Grátis';
            return (
              <tr key={est.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">
                  <button onClick={() => onEditarEstabelecimento(est)} className="text-blue-600 hover:underline text-left">
                    {est.nome}
                  </button>
                </td>
                <td className="p-4 text-sm">{est.bairro}</td>
                <td className="p-4 text-sm">{est.tipo_cozinha}</td>
                <td className="p-4 text-sm font-medium">{nomePlano}</td>
                <td className="p-4 text-xs font-mono">{est.qrcode_short_url || 'N/A'}</td>
                <td className="p-4 text-sm">{est.scans_qrcode || 0}</td>
                <td className="p-4">
                  <button
                    onClick={() => onToggleStatus(est.id, est.ativo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      est.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {est.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleDestaque(est.id, est.destaque)}
                      className={est.destaque ? 'text-yellow-500' : 'text-gray-400'}
                      title="Destacar"
                    >
                      {est.destaque ? '⭐' : '☆'}
                    </button>
                    <a href={`/menu/${est.qrcode_short_url}`} target="_blank" className="text-blue-600 hover:text-blue-800" title="Ver cardápio">📱</a>
                    <button onClick={() => onEditarEstabelecimento(est)} className="text-orange-500 hover:text-orange-700" title="Editar dados">✏️</button>
                    <button onClick={() => onExcluir(est.id, est.nome)} className="text-red-500 hover:text-red-700" title="Excluir">🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {estabelecimentos.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">Nenhum estabelecimento cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function GerenciadorPlanos({
  planos,
  temas,
  modelosQR,
  recursos,
  onToggleTema,
  onToggleModeloQR,
  onToggleRecurso,
  onAlterarLimite,
  onNovoPlano,
  onExcluirPlano,
}: {
  planos: any[]
  temas: any[]
  modelosQR: any[]
  recursos: any[]
  onToggleTema: (planoId: string, temaSlug: string, marcado: boolean) => void
  onToggleModeloQR: (planoId: string, modeloSlug: string, marcado: boolean) => void
  onToggleRecurso: (planoId: string, recursoSlug: string, marcado: boolean) => void
  onAlterarLimite: (planoId: string, novoLimite: number) => void
  onNovoPlano: () => void
  onExcluirPlano: (id: string, nome: string) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">💰 Gerenciar Planos e Temas</h2>
        <button onClick={onNovoPlano} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
          ➕ Novo Plano
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <div key={plano.id} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-gray-900">{plano.nome}</h3>
            <p className="text-3xl font-bold text-orange-600 mb-4">
              {plano.preco_mensal === 0 ? 'Grátis' : `R$ ${plano.preco_mensal}/mês`}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Itens máximos:</label>
              <input
                type="number"
                min={1}
                max={999}
                value={plano.limite_itens}
                onChange={(e) => onAlterarLimite(plano.id, parseInt(e.target.value) || 1)}
                className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 text-gray-900 text-center focus:border-orange-500 focus:ring-orange-200"
              />
            </div>

            {/* Temas */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Temas disponíveis:</h4>
              {temas.map((tema) => {
                const marcado = plano.temas_permitidos?.includes(tema.slug) || false
                return (
                  <label key={`${plano.id}-tema-${tema.slug}`} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => onToggleTema(plano.id, tema.slug, marcado)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full inline-block border border-gray-300"
                        style={{ backgroundColor: tema.cores?.[0] || '#ccc' }}
                      />
                      <span className="text-gray-800 text-sm">{tema.nome}</span>
                    </span>
                    {!marcado && <span className="text-xs text-red-400 ml-1">(não incluso)</span>}
                  </label>
                )
              })}
            </div>

            {/* Modelos de QR Code */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">QR Codes disponíveis:</h4>
              {modelosQR.map((modelo) => {
                const marcado = plano.modelos_qrcode_permitidos?.includes(modelo.slug) || false
                return (
                  <label key={`${plano.id}-qr-${modelo.slug}`} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => onToggleModeloQR(plano.id, modelo.slug, marcado)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded border"
                        style={{
                          backgroundColor: modelo.cor_fundo,
                          borderColor: modelo.cor_frente,
                        }}
                      />
                      <span className="text-gray-800 text-sm">{modelo.nome}</span>
                    </span>
                    {!marcado && <span className="text-xs text-red-400 ml-1">(não incluso)</span>}
                  </label>
                )
              })}
            </div>

            {/* Recursos */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Recursos disponíveis:</h4>
              {recursos.map((recurso) => {
                const marcado = plano.recursos_permitidos?.includes(recurso.slug) || false
                return (
                  <label key={`${plano.id}-recurso-${recurso.slug}`} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => onToggleRecurso(plano.id, recurso.slug, marcado)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-800 text-sm">{recurso.nome}</span>
                    {!marcado && <span className="text-xs text-red-400 ml-1">(não incluso)</span>}
                  </label>
                )
              })}
            </div>

            {/* Botão de excluir */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => onExcluirPlano(plano.id, plano.nome)}
                className="text-red-600 text-sm hover:underline"
              >
                🗑️ Excluir plano
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NovoPlanoModal({ onClose, onSave }: { onClose: () => void; onSave: (dados: any) => void }) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState(0)
  const [limite, setLimite] = useState(15)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ nome, preco_mensal: preco, limite_itens: limite })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">➕ Novo Plano</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço (R$/mês)</label>
            <input type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(parseFloat(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Limite de itens</label>
            <input type="number" min="1" value={limite} onChange={(e) => setLimite(parseInt(e.target.value) || 1)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg">Criar</button>
            <button type="button" onClick={onClose} className="flex-1 border px-4 py-2 rounded-lg">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditarEstabelecimentoModal({
  estabelecimento,
  planos,
  onClose,
  onSave,
}: {
  estabelecimento: any
  planos: any[]
  onClose: () => void
  onSave: (dados: any) => void
}) {
  const [form, setForm] = useState({
    nome: estabelecimento.nome || '',
    tipo_cozinha: estabelecimento.tipo_cozinha || 'baiana',
    tipo_estabelecimento: estabelecimento.tipo_estabelecimento || 'restaurante',
    bairro: estabelecimento.bairro || '',
    endereco: estabelecimento.endereco || '',
    cep: estabelecimento.cep || '',
    telefone: estabelecimento.telefone || '',
    whatsapp: estabelecimento.whatsapp || '',
    email: estabelecimento.email || '',
    instagram: estabelecimento.instagram || '',
    descricao: estabelecimento.descricao || '',
    plano_id: estabelecimento.plano_id || '',
    ativo: estabelecimento.ativo ?? true,
    destaque: estabelecimento.destaque ?? false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, id: estabelecimento.id })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        <h3 className="font-bold text-lg mb-4">✏️ Editar Estabelecimento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nome *</label><input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Bairro *</label><input type="text" required value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo de Cozinha</label><select value={form.tipo_cozinha} onChange={(e) => setForm({ ...form, tipo_cozinha: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="baiana">Baiana</option><option value="acaraje">Acarajé</option><option value="brasileira">Brasileira</option><option value="italiana">Italiana</option><option value="japonesa">Japonesa</option><option value="hamburguer">Hambúrguer</option><option value="contemporanea">Contemporânea</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Tipo de Estabelecimento</label><select value={form.tipo_estabelecimento} onChange={(e) => setForm({ ...form, tipo_estabelecimento: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="restaurante">Restaurante</option><option value="bar">Bar</option><option value="cafeteria">Cafeteria</option><option value="banca_acaraje">Banca de Acarajé</option><option value="foodtruck">Food Truck</option><option value="lanchonete">Lanchonete</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Plano</label><select value={form.plano_id} onChange={(e) => setForm({ ...form, plano_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Sem plano</option>{planos.map((plano) => (<option key={plano.id} value={plano.id}>{plano.nome} {plano.preco_mensal > 0 ? `- R$ ${plano.preco_mensal}` : ''}</option>))}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Endereço</label><input type="text" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">CEP</label><input type="text" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Telefone</label><input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">WhatsApp</label><input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Instagram</label><input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="@usuario" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Descrição</label><textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /><span className="text-sm">Ativo</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} /><span className="text-sm">Destaque ⭐</span></label>
          </div>
          <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">💾 Salvar</button><button type="button" onClick={onClose} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">Cancelar</button></div>
        </form>
      </div>
    </div>
  )
}

// NOVO COMPONENTE: Gerenciar Home
function GerenciarHome() {
  const [modulos, setModulos] = useState<any[]>([]);
  const [bgImage, setBgImage] = useState('');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const { data: mod } = await supabase.from('modulos_home').select('*');
    if (mod) setModulos(mod);

    const { data: conf } = await supabase
      .from('configuracoes')
      .select('*')
      .in('chave', ['hero_background_image', 'hero_font_color']);
    const bg = conf?.find((c: any) => c.chave === 'hero_background_image')?.valor || '';
    const fc = conf?.find((c: any) => c.chave === 'hero_font_color')?.valor || '#ffffff';
    setBgImage(bg);
    setFontColor(fc);
    setLoading(false);
  };

  const toggleModulo = async (slug: string, ativo: boolean) => {
    await supabase.from('modulos_home').update({ ativo: !ativo }).eq('slug', slug);
    carregarDados();
  };

  const salvarBgImage = async () => {
    await supabase.from('configuracoes').upsert({ chave: 'hero_background_image', valor: bgImage });
    alert('Imagem de fundo salva!');
  };

  const salvarFontColor = async () => {
    await supabase.from('configuracoes').upsert({ chave: 'hero_font_color', valor: fontColor });
    alert('Cor da fonte salva!');
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🏠 Configurar Página Inicial</h2>

      {/* Módulos */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4">Módulos ativos</h3>
        <div className="space-y-2">
          {modulos.map((mod) => (
            <label key={mod.slug} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mod.ativo}
                onChange={() => toggleModulo(mod.slug, mod.ativo)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-gray-800">{mod.nome}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Imagem de fundo do hero */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4">Imagem de fundo do topo</h3>
        <ImageUpload
          onUpload={(url) => setBgImage(url)}
          defaultImage={bgImage}
        />
        <button
          onClick={salvarBgImage}
          className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          💾 Salvar imagem
        </button>
      </div>

      {/* Cor da fonte */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Cor da fonte do topo</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-16 h-10 border rounded cursor-pointer"
          />
          <input
            type="text"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="border rounded-lg px-3 py-2 font-mono text-sm"
          />
          <button
            onClick={salvarFontColor}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            💾 Salvar cor
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------

export default function AdminPage() {
  const [logado, setLogado] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [planos, setPlanos] = useState<any[]>([])
  const [temas, setTemas] = useState<any[]>([])
  const [modelosQR, setModelosQR] = useState<any[]>([])
  const [recursos, setRecursos] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, scans: 0 })
  const [mostrarNovoPlano, setMostrarNovoPlano] = useState(false)
  const [estabelecimentoEditando, setEstabelecimentoEditando] = useState<any>(null)

  // Ordenação
  const [ordenacao, setOrdenacao] = useState<{ coluna: string | null; direcao: 'asc' | 'desc' }>({
    coluna: null,
    direcao: 'asc',
  })

  const carregarDados = useCallback(async () => {
    const { data } = await supabase
      .from('estabelecimentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setEstabelecimentos(data)
      setStats({
        total: data.length,
        ativos: data.filter((e) => e.ativo).length,
        inativos: data.filter((e) => !e.ativo).length,
        scans: data.reduce((sum, e) => sum + (e.scans_qrcode || 0), 0),
      })
    }
  }, [])

  const carregarPlanosETemas = useCallback(async () => {
    const [
      { data: planosData },
      { data: temasData },
      { data: modelosData },
      { data: recursosData },
    ] = await Promise.all([
      supabase.from('planos').select('*'),
      supabase.from('temas').select('*'),
      supabase.from('modelos_qrcode').select('*'),
      supabase.from('recursos_menu').select('*'),
    ])
    if (planosData) setPlanos(planosData)
    if (temasData) setTemas(temasData)
    if (modelosData) setModelosQR(modelosData)
    if (recursosData) setRecursos(recursosData)
  }, [])

  useEffect(() => {
    if (logado) {
      carregarDados()
      carregarPlanosETemas()
    }
  }, [logado, carregarDados, carregarPlanosETemas])

  const toggleStatus = async (id: string, ativo: boolean) => {
    await supabase.from('estabelecimentos').update({ ativo: !ativo }).eq('id', id)
    carregarDados()
  }

  const toggleDestaque = async (id: string, destaque: boolean) => {
    await supabase.from('estabelecimentos').update({ destaque: !destaque }).eq('id', id)
    carregarDados()
  }

  const excluirEstabelecimento = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      await supabase.from('estabelecimentos').delete().eq('id', id)
      carregarDados()
    }
  }

  const abrirEdicaoEstabelecimento = (est: any) => {
    setEstabelecimentoEditando(est)
  }

  const salvarEstabelecimento = async (dados: any) => {
    const { error } = await supabase.from('estabelecimentos').update(dados).eq('id', dados.id)
    if (!error) {
      carregarDados()
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  // Funções de planos
  const toggleTemaPlano = async (planoId: string, temaSlug: string, marcado: boolean) => {
    const planoCopia = planos.find((p) => p.id === planoId)
    if (!planoCopia) return
    const temasAtuais = planoCopia.temas_permitidos || []
    const novosTemas = marcado ? temasAtuais.filter((t: string) => t !== temaSlug) : [...temasAtuais, temaSlug]
    const { error } = await supabase.from('planos').update({ temas_permitidos: novosTemas }).eq('id', planoId)
    if (!error) carregarPlanosETemas()
    else alert('Erro ao atualizar temas: ' + error.message)
  }

  const toggleModeloQRPlano = async (planoId: string, modeloSlug: string, marcado: boolean) => {
    const planoCopia = planos.find((p) => p.id === planoId)
    if (!planoCopia) return
    const modelosAtuais = planoCopia.modelos_qrcode_permitidos || []
    const novosModelos = marcado ? modelosAtuais.filter((m: string) => m !== modeloSlug) : [...modelosAtuais, modeloSlug]
    const { error } = await supabase.from('planos').update({ modelos_qrcode_permitidos: novosModelos }).eq('id', planoId)
    if (!error) carregarPlanosETemas()
    else alert('Erro ao atualizar modelos QR: ' + error.message)
  }

  const toggleRecursoPlano = async (planoId: string, recursoSlug: string, marcado: boolean) => {
    const planoCopia = planos.find((p) => p.id === planoId)
    if (!planoCopia) return
    const recursosAtuais = planoCopia.recursos_permitidos || []
    const novosRecursos = marcado ? recursosAtuais.filter((r: string) => r !== recursoSlug) : [...recursosAtuais, recursoSlug]
    const { error } = await supabase.from('planos').update({ recursos_permitidos: novosRecursos }).eq('id', planoId)
    if (!error) carregarPlanosETemas()
    else alert('Erro ao atualizar recursos: ' + error.message)
  }

  const alterarLimitePlano = async (planoId: string, novoLimite: number) => {
    const { error } = await supabase.from('planos').update({ limite_itens: novoLimite }).eq('id', planoId)
    if (!error) carregarPlanosETemas()
    else alert('Erro ao atualizar limite: ' + error.message)
  }

  const excluirPlano = async (id: string, nome: string) => {
    const { count, error: countError } = await supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('plano_id', id)
    if (countError) { alert('Erro ao verificar estabelecimentos: ' + countError.message); return }
    if (count && count > 0) { alert(`Não é possível excluir o plano "${nome}" porque há ${count} estabelecimento(s) vinculado(s).`); return }
    if (confirm(`Tem certeza que deseja excluir o plano "${nome}"?`)) {
      const { error } = await supabase.from('planos').delete().eq('id', id)
      if (!error) carregarPlanosETemas()
      else alert('Erro ao excluir plano: ' + error.message)
    }
  }

  const criarPlano = async (dados: any) => {
    const slug = dados.nome.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase.from('planos').insert({
      nome: dados.nome,
      slug,
      preco_mensal: dados.preco_mensal,
      limite_itens: dados.limite_itens,
      temas_permitidos: [],
      modelos_qrcode_permitidos: [],
      recursos_permitidos: [],
    })
    if (!error) carregarPlanosETemas()
    else alert('Erro ao criar plano: ' + error.message)
  }

  // Ordenação
  const handleOrdenar = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc',
    }))
  }

  const estabelecimentosOrdenados = [...estabelecimentos].sort((a, b) => {
    if (!ordenacao.coluna) return 0
    const aVal = a[ordenacao.coluna]
    const bVal = b[ordenacao.coluna]
    if (typeof aVal === 'string') {
      return ordenacao.direcao === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return ordenacao.direcao === 'asc'
      ? (aVal ?? 0) - (bVal ?? 0)
      : (bVal ?? 0) - (aVal ?? 0)
  })

  if (!logado) {
    return <LoginForm onLogin={(senha) => { if (senha === 'admin123') setLogado(true) }} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">⚙️ Painel Admin</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 text-sm hover:underline">Ver Site →</Link>
          <button onClick={() => setLogado(false)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Sair</button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white min-h-screen shadow-sm p-4 space-y-1">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'estabelecimentos', icon: '🏪', label: 'Estabelecimentos' },
            { key: 'novo', icon: '➕', label: 'Novo' },
            { key: 'planos', icon: '💰', label: 'Planos' },
            { key: 'home', icon: '🏠', label: 'Página Inicial' },
          ].map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${
                abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6">
          {abaAtiva === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>
              <DashboardCards stats={stats} />
              <TabelaDistribuicao estabelecimentos={estabelecimentos} />
            </div>
          )}

          {abaAtiva === 'estabelecimentos' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">🏪 Estabelecimentos</h2>
              <TabelaEstabelecimentos
                estabelecimentos={estabelecimentosOrdenados}
                onToggleStatus={toggleStatus}
                onToggleDestaque={toggleDestaque}
                onExcluir={excluirEstabelecimento}
                onEditarEstabelecimento={abrirEdicaoEstabelecimento}
                planos={planos}
                ordenacao={ordenacao}
                onOrdenar={handleOrdenar}
              />
            </div>
          )}

          {abaAtiva === 'novo' && (
            <FormNovoEstabelecimento onSave={() => { carregarDados(); setAbaAtiva('estabelecimentos') }} />
          )}

          {abaAtiva === 'planos' && (
            <div>
              <GerenciadorPlanos
                planos={planos}
                temas={temas}
                modelosQR={modelosQR}
                recursos={recursos}
                onToggleTema={toggleTemaPlano}
                onToggleModeloQR={toggleModeloQRPlano}
                onToggleRecurso={toggleRecursoPlano}
                onAlterarLimite={alterarLimitePlano}
                onNovoPlano={() => setMostrarNovoPlano(true)}
                onExcluirPlano={excluirPlano}
              />
            </div>
          )}

          {abaAtiva === 'home' && <GerenciarHome />}
        </main>
      </div>

      {mostrarNovoPlano && (
        <NovoPlanoModal
          onClose={() => setMostrarNovoPlano(false)}
          onSave={criarPlano}
        />
      )}

      {estabelecimentoEditando && (
        <EditarEstabelecimentoModal
          estabelecimento={estabelecimentoEditando}
          planos={planos}
          onClose={() => setEstabelecimentoEditando(null)}
          onSave={salvarEstabelecimento}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Formulário de novo estabelecimento
// ----------------------------------------------------------------
function FormNovoEstabelecimento({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    nome: '',
    tipo_cozinha: 'baiana',
    tipo_estabelecimento: 'restaurante',
    bairro: '',
    endereco: '',
    whatsapp: '',
    descricao: '',
    plano_id: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [planosLocais, setPlanosLocais] = useState<any[]>([])

  useEffect(() => {
    supabase.from('planos').select('*').then(({ data }) => {
      if (data) setPlanosLocais(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.bairro || !form.endereco) {
      alert('Preencha nome, bairro e endereço!')
      return
    }
    setSalvando(true)

    const slug = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6)

    const shortUrl = Math.random().toString(36).substring(2, 10)

    const { error } = await supabase.from('estabelecimentos').insert({
      nome: form.nome,
      slug,
      tipo_cozinha: form.tipo_cozinha,
      tipo_estabelecimento: form.tipo_estabelecimento,
      bairro: form.bairro,
      endereco: form.endereco,
      whatsapp: form.whatsapp,
      descricao: form.descricao,
      plano_id: form.plano_id || null,
      qrcode_short_url: shortUrl,
      ativo: true,
    })

    if (error) {
      alert('Erro ao cadastrar: ' + error.message)
    } else {
      onSave()
      setForm({
        nome: '',
        tipo_cozinha: 'baiana',
        tipo_estabelecimento: 'restaurante',
        bairro: '',
        endereco: '',
        whatsapp: '',
        descricao: '',
        plano_id: '',
      })
    }
    setSalvando(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">➕ Novo Estabelecimento</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bairro *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cozinha</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_cozinha} onChange={e => setForm({...form, tipo_cozinha: e.target.value})}>
              <option value="baiana">Baiana</option>
              <option value="acaraje">Acarajé</option>
              <option value="brasileira">Brasileira</option>
              <option value="italiana">Italiana</option>
              <option value="japonesa">Japonesa</option>
              <option value="hamburguer">Hambúrguer</option>
              <option value="contemporanea">Contemporânea</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Estabelecimento</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_estabelecimento} onChange={e => setForm({...form, tipo_estabelecimento: e.target.value})}>
              <option value="restaurante">Restaurante</option>
              <option value="bar">Bar</option>
              <option value="cafeteria">Cafeteria</option>
              <option value="banca_acaraje">Banca de Acarajé</option>
              <option value="foodtruck">Food Truck</option>
              <option value="lanchonete">Lanchonete</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Endereço *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plano</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.plano_id} onChange={e => setForm({...form, plano_id: e.target.value})}>
              <option value="">Grátis (padrão)</option>
              {planosLocais.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome} {plano.preco_mensal > 0 ? `- R$ ${plano.preco_mensal}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50">
          {salvando ? 'Salvando...' : '💾 Salvar Estabelecimento'}
        </button>
      </form>
    </div>
  )
}