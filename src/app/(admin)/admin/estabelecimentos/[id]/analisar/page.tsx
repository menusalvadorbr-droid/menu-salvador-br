import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditarEstabelecimentoAdminForm from '../editar/EditarEstabelecimentoAdminForm'
import EditorCulinarias from '@/app/(dashboard)/painel/estabelecimento/[id]/editar/components/EditorCulinarias'
import { alterarCargoFuncionarioAdmin, desativarFuncionarioAdmin } from '../responsaveis/actions'
import SecaoExpansivel from './SecaoExpansivel'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

const CARGO_LABEL: Record<string, string> = {
  gerente: '👔 Gerente',
  caixa: '💰 Caixa',
  garcom: '🍽️ Garçom',
  cozinha: '👨‍🍳 Cozinha',
  contador: '🧾 Contador',
}

export default async function AnalisarEstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/admin')

  // supabaseAdmin (service role) pra tudo aqui — mesma razão de sempre:
  // não depender de policy de RLS que talvez não libere super_admin em
  // alguma dessas tabelas relacionadas.
  const { data: estabelecimento } = await supabaseAdmin
    .from('estabelecimentos')
    .select(
      'id, nome, nome_fantasia, slug, descricao, endereco, numero, tipo_logradouro, complemento, cep, bairro, bairro_id, cidade, telefone, whatsapp, instagram, tipo_estabelecimento, tipo_cozinha, link_google_maps, latitude, longitude, cnpj, razao_social, owner_user_id, socios, situacao_cadastral'
    )
    .eq('id', id)
    .maybeSingle()

  if (!estabelecimento) notFound()

  const [
    { data: bairros },
    { data: tiposEstabelecimento },
    { data: culinariasAtuais },
    { data: proprietario },
    { data: funcionarios },
    { data: claims },
  ] = await Promise.all([
    supabaseAdmin.from('bairros').select('id, nome, slug').order('nome'),
    supabaseAdmin.from('tipos_estabelecimento').select('slug, nome, icone').eq('ativo', true).order('ordem'),
    supabaseAdmin
      .from('estabelecimento_tipos_cozinha')
      .select('tipos_cozinha(nome)')
      .eq('estabelecimento_id', id),
    estabelecimento.owner_user_id
      ? supabaseAdmin.from('profiles').select('id, nome, email, phone').eq('id', estabelecimento.owner_user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from('funcionarios').select('id, cargo, ativo, user_id').eq('estabelecimento_id', id).order('ativo', { ascending: false }),
    supabaseAdmin.from('restaurant_claims').select('*').eq('estabelecimento_id', id).order('created_at', { ascending: false }),
  ])

  const funcionariosComPerfil: Array<Record<string, any>> = []
  for (const f of funcionarios || []) {
    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('nome, email, phone')
      .eq('id', f.user_id)
      .maybeSingle()
    funcionariosComPerfil.push({ ...f, perfil })
  }

  // Descobre o "responsável" a mostrar no topo, travado — na ordem mais
  // confiável disponível: dono já vinculado > pessoa que reivindicou
  // (mesmo que ainda em análise) > sócio-administrador informado na
  // consulta de CNPJ (só quando não há dono nem reivindicação nenhuma).
  let responsavel: { nome: string; origem: string } | null = null

  if (proprietario) {
    responsavel = { nome: proprietario.nome || proprietario.email, origem: 'Proprietário' }
  }
  if (!responsavel) {
    const claimMaisRecente = claims?.[0]
    if (claimMaisRecente?.nome_responsavel) {
      responsavel = { nome: claimMaisRecente.nome_responsavel, origem: `Reivindicação (${claimMaisRecente.status})` }
    }
  }
  if (!responsavel && Array.isArray(estabelecimento.socios) && estabelecimento.socios.length > 0) {
    const socios = estabelecimento.socios as any[]
    const administrador = socios.find((s) => s.qualificacao?.toLowerCase().includes('administrador')) || socios[0]
    if (administrador?.nome) {
      responsavel = { nome: administrador.nome, origem: 'Sócio-administrador (Receita Federal)' }
    }
  }

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const nomesCulinarias = (culinariasAtuais || []).map((c: any) => c.tipos_cozinha?.nome).filter(Boolean)
  const funcionariosAtivos = funcionariosComPerfil.filter((f) => f.ativo)

  return (
    <div>
      <Link href="/admin/estabelecimentos" className="text-sm text-neutral-500 hover:text-orange-600">
        ← Voltar
      </Link>
      <div className="mt-1">
        <AdminPageHeader titulo={nomeExibicao} descricao={`/${estabelecimento.slug}`} />
      </div>

      {/* Bloco travado — CNPJ, razão social e responsável, mesma referência de sempre */}
      <div className="mt-4 mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">CNPJ</p>
          <p className="text-sm font-medium text-neutral-700">{estabelecimento.cnpj || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Razão social</p>
          <p className="text-sm font-medium text-neutral-700">{estabelecimento.razao_social || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Situação</p>
          <p className="text-sm font-medium text-neutral-700">{estabelecimento.situacao_cadastral || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Responsável</p>
          <p className="text-sm font-medium text-neutral-700">{responsavel?.nome || '—'}</p>
          {responsavel && <p className="text-xs text-neutral-400">{responsavel.origem}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SecaoExpansivel
          titulo="Dados e endereço"
          resumo={
            <>
              {estabelecimento.tipo_estabelecimento || 'sem tipo'}
              {estabelecimento.bairro ? ` · ${estabelecimento.bairro}` : ''}
            </>
          }
        >
          <EditarEstabelecimentoAdminForm
            estabelecimento={estabelecimento}
            bairros={bairros || []}
            tiposEstabelecimento={tiposEstabelecimento || []}
          />
        </SecaoExpansivel>

        <SecaoExpansivel
          titulo="Culinária"
          resumo={nomesCulinarias.length > 0 ? nomesCulinarias.join(', ') : 'nenhuma selecionada'}
        >
          <EditorCulinarias estabelecimentoId={estabelecimento.id} />
        </SecaoExpansivel>

        <SecaoExpansivel
          titulo="Proprietário"
          resumo={proprietario ? proprietario.nome || proprietario.email : 'sem proprietário — aguardando reivindicação'}
        >
          {proprietario ? (
            <div className="text-sm">
              <p className="font-medium text-neutral-900">{proprietario.nome || '—'}</p>
              <p className="text-neutral-500">{proprietario.email}</p>
              {proprietario.phone && <p className="text-neutral-500">{proprietario.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">
              Sem proprietário vinculado — o estabelecimento fica visível ao público esperando alguém reivindicar.
            </p>
          )}
        </SecaoExpansivel>

        <SecaoExpansivel
          titulo="Equipe"
          resumo={`${funcionariosAtivos.length} ativo${funcionariosAtivos.length !== 1 ? 's' : ''}`}
        >
          {funcionariosComPerfil.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum funcionário vinculado.</p>
          ) : (
            <div className="space-y-3">
              {funcionariosComPerfil.map((f) => (
                <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="text-sm">
                    <p className="font-medium text-neutral-900">{f.perfil?.nome || f.perfil?.email || '—'}</p>
                    <p className="text-neutral-500">{f.perfil?.email}</p>
                    {!f.ativo && <span className="text-xs text-red-500">Inativo</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <CargoSelect funcionarioId={f.id} estabelecimentoId={id} cargoAtual={f.cargo} />
                    {f.ativo && (
                      <form action={desativarFuncionarioAdmin.bind(null, f.id, id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline px-2 py-1">
                          Desativar
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SecaoExpansivel>

        <SecaoExpansivel
          titulo="Histórico de reivindicações"
          resumo={`${claims?.length || 0} registro${(claims?.length || 0) !== 1 ? 's' : ''}`}
        >
          {!claims || claims.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma reivindicação registrada.</p>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{c.nome_responsavel || '—'}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-neutral-500">
                    CPF {c.cpf_responsavel ? c.cpf_responsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}
                    {' · '}
                    {c.telefone_contato || c.whatsapp_contato || 'sem contato'}
                  </p>
                  <p className="text-xs text-neutral-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </SecaoExpansivel>
      </div>
    </div>
  )
}

// Pequeno componente server-side com um form por opção de cargo — evita
// precisar de um client component só pra um <select> com submit automático.
function CargoSelect({
  funcionarioId,
  estabelecimentoId,
  cargoAtual,
}: {
  funcionarioId: string
  estabelecimentoId: string
  cargoAtual: string
}) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const novoCargo = formData.get('cargo') as string
        await alterarCargoFuncionarioAdmin(funcionarioId, estabelecimentoId, novoCargo)
      }}
      className="flex items-center gap-1"
    >
      <select name="cargo" defaultValue={cargoAtual} className="text-sm border border-neutral-200 rounded-lg px-2 py-1">
        {Object.entries(CARGO_LABEL).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <button type="submit" className="text-xs text-orange-600 hover:underline px-1">
        Salvar
      </button>
    </form>
  )
}
