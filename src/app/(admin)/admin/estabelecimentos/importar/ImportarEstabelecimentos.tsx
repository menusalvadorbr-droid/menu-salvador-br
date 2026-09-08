'use client'

import { useState } from 'react'
import { limparNumeroEndereco, formatarCep, formatarTelefone, limparTelefone } from '@/lib/utils'
import { validarCnpj, limparCnpj, formatarCnpj } from '@/lib/cnpj'
import SeletorCulinariaTags from '@/app/(dashboard)/painel/estabelecimento/[id]/editar/components/SeletorCulinariaTags'
import SeletorHorarios, { periodosPadrao, type PeriodoHorario } from '@/components/SeletorHorarios'
import { Loader2, Plus } from 'lucide-react'
import { consultarCnpjParaImportacao, criarEstabelecimentoImportado, type HorarioImportado } from './actions'
import { criarBairro } from '../../bairros/actions'

type StatusItem = 'pendente' | 'carregando' | 'pronto' | 'duplicado' | 'erro' | 'inserido' | 'pulado' | 'descartado'

interface FilaItem {
  cnpjOriginal: string
  cnpjLimpo: string
  status: StatusItem
  erro?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados?: any
  cidadeId?: string
  cidadeNome?: string
  bairroId?: string | null
  existente?: { nome_fantasia: string; slug: string }
}

interface Props {
  bairros: { id: string; nome: string; cidade_id: string | null }[]
  tiposEstabelecimento: { id: number; slug: string; nome: string; icone: string | null }[]
  tiposCozinha: { id: number; nome: string; icone: string | null }[]
}

function periodosParaHorarioImportado(periodos: PeriodoHorario[]): HorarioImportado[] {
  return periodos
    .filter((p) => !p.fechado)
    .map((p) => ({
      diaSemana: p.dia_semana,
      horarioAbertura: p.horario_abertura.substring(0, 5),
      horarioFechamento: p.horario_fechamento.substring(0, 5),
      fechado: false,
    }))
}

export default function ImportarEstabelecimentos({ bairros: bairrosIniciais, tiposEstabelecimento, tiposCozinha }: Props) {
  const [etapa, setEtapa] = useState<'lista' | 'revisao'>('lista')
  const [textoLista, setTextoLista] = useState('')
  const [fila, setFila] = useState<FilaItem[]>([])
  const [indice, setIndice] = useState(0)
  const [bairros, setBairros] = useState(bairrosIniciais)

  // Estado do formulário do item atual
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cidadeId, setCidadeId] = useState('')
  const [cidadeNome, setCidadeNome] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [numero, setNumero] = useState('')
  const [tipoEstabelecimentoId, setTipoEstabelecimentoId] = useState('')
  const [culinariaIds, setCulinariaIds] = useState<number[]>([])
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [site, setSite] = useState('')
  const [email, setEmail] = useState('')
  const [linkGoogleMaps, setLinkGoogleMaps] = useState('')
  const [horarios, setHorarios] = useState<PeriodoHorario[]>(periodosPadrao())
  const [fotos, setFotos] = useState<string[]>([])
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  const [novoBairroAberto, setNovoBairroAberto] = useState(false)
  const [novoBairroNome, setNovoBairroNome] = useState('')
  const [criandoBairro, setCriandoBairro] = useState(false)
  const [erroBairro, setErroBairro] = useState<string | null>(null)

  const itemAtual = fila[indice]

  function processarLista() {
    const linhas = textoLista
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const novaFila: FilaItem[] = linhas.map((linha) => {
      const cnpjLimpo = limparCnpj(linha)
      if (!validarCnpj(cnpjLimpo)) {
        return { cnpjOriginal: linha, cnpjLimpo, status: 'erro', erro: 'CNPJ inválido' }
      }
      return { cnpjOriginal: linha, cnpjLimpo, status: 'pendente' }
    })

    setFila(novaFila)
    setIndice(0)
    setEtapa('revisao')
    if (novaFila.length > 0 && novaFila[0].status === 'pendente') {
      carregarItem(0, novaFila)
    }
  }

  function resetarFormulario() {
    setNomeFantasia('')
    setCidadeId('')
    setCidadeNome('')
    setBairroId('')
    setNumero('')
    setTipoEstabelecimentoId('')
    setCulinariaIds([])
    setTelefone('')
    setWhatsapp('')
    setInstagram('')
    setSite('')
    setEmail('')
    setLinkGoogleMaps('')
    setHorarios(periodosPadrao())
    setFotos([])
    setErroSalvar(null)
    setNovoBairroAberto(false)
    setNovoBairroNome('')
    setErroBairro(null)
  }

  function preencherFormularioComItem(item: FilaItem) {
    const d = item.dados
    setNomeFantasia(d?.nomeFantasia || d?.razaoSocial || '')
    setCidadeId(item.cidadeId || '')
    setCidadeNome(item.cidadeNome || '')
    setBairroId(item.bairroId || '')
    setNumero(limparNumeroEndereco(d?.numero))
    setTelefone(d?.telefone || '')
    setEmail(d?.email || '')
  }

  async function carregarItem(i: number, filaAtual: FilaItem[]) {
    const item = filaAtual[i]
    if (!item || item.status !== 'pendente') return

    setFila((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'carregando' } : f)))

    try {
      const resultado = await consultarCnpjParaImportacao(item.cnpjLimpo)
      if (resultado.jaExiste) {
        setFila((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'duplicado', existente: resultado.existente } : f))
        )
      } else {
        setFila((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'pronto', dados: resultado.dados, cidadeId: resultado.cidadeId, cidadeNome: resultado.cidadeNome, bairroId: resultado.bairroId }
              : f
          )
        )
        resetarFormulario()
        preencherFormularioComItem({ ...item, dados: resultado.dados, cidadeId: resultado.cidadeId, cidadeNome: resultado.cidadeNome, bairroId: resultado.bairroId })
      }
    } catch (err) {
      setFila((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'erro', erro: err instanceof Error ? err.message : 'Erro ao consultar' } : f))
      )
    }
  }

  function irPara(novoIndice: number) {
    setIndice(novoIndice)
    if (novoIndice < fila.length && fila[novoIndice].status === 'pendente') {
      carregarItem(novoIndice, fila)
    } else if (fila[novoIndice]?.status === 'pronto') {
      resetarFormulario()
      preencherFormularioComItem(fila[novoIndice])
    }
  }

  function marcarStatus(i: number, status: StatusItem) {
    setFila((prev) => prev.map((f, idx) => (idx === i ? { ...f, status } : f)))
  }

  function pular() {
    marcarStatus(indice, 'pulado')
    irPara(indice + 1)
  }

  function descartar() {
    marcarStatus(indice, 'descartado')
    irPara(indice + 1)
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || fotos.length >= 2) return
    const file = e.target.files[0]
    setEnviandoFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.secure_url) throw new Error(data.error?.message || data.error || 'Erro no upload')
      setFotos((prev) => [...prev, data.secure_url])
    } catch (err) {
      alert('Erro ao enviar foto: ' + (err instanceof Error ? err.message : 'erro desconhecido'))
    }
    setEnviandoFoto(false)
    e.target.value = ''
  }

  function abrirGoogleMaps() {
    const d = itemAtual?.dados
    const endereco = [d?.endereco, d?.cidade || 'Salvador', d?.uf || 'BA'].filter(Boolean).join(', ')
    const busca = `${nomeFantasia || d?.razaoSocial || ''} ${endereco}`.trim()
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`, '_blank', 'noopener')
  }

  async function criarBairroInline() {
    if (!cidadeId || !novoBairroNome.trim()) return
    setCriandoBairro(true)
    setErroBairro(null)
    try {
      const { id } = await criarBairro(novoBairroNome.trim(), '', cidadeId)
      setBairros((prev) => [...prev, { id, nome: novoBairroNome.trim(), cidade_id: cidadeId }])
      setBairroId(id)
      setNovoBairroAberto(false)
      setNovoBairroNome('')
    } catch (err) {
      setErroBairro(err instanceof Error ? err.message : 'Erro ao criar bairro.')
    } finally {
      setCriandoBairro(false)
    }
  }

  async function inserir() {
    const d = itemAtual?.dados
    if (!d) return
    const tipoSelecionado = tiposEstabelecimento.find((t) => String(t.id) === tipoEstabelecimentoId)
    if (!tipoSelecionado) return
    setSalvando(true)
    setErroSalvar(null)
    try {
      await criarEstabelecimentoImportado({
        cnpj: itemAtual.cnpjLimpo,
        razaoSocial: d.razaoSocial,
        nomeFantasia,
        situacaoCadastral: d.situacaoCadastral,
        atividadeEconomica: d.atividadeEconomica,
        cnaeCodigo: d.cnaeCodigo,
        tipoLogradouro: d.tipoLogradouro,
        endereco: d.logradouro,
        numero,
        cep: d.cep,
        cidade: cidadeNome,
        cidadeId,
        dataAbertura: d.dataAbertura,
        opcaoPeloSimples: d.opcaoPeloSimples,
        dataOpcaoPeloSimples: d.dataOpcaoPeloSimples,
        socios: d.socios,
        telefone: limparTelefone(telefone),
        whatsapp: limparTelefone(whatsapp),
        instagram,
        site,
        email,
        bairroId: bairroId || null,
        bairroInformado: d.bairro || null,
        tipoEstabelecimentoId: tipoSelecionado.id,
        tipoEstabelecimentoSlug: tipoSelecionado.slug,
        culinariaIds,
        linkGoogleMaps,
        horarios: periodosParaHorarioImportado(horarios),
        galeriaFotos: fotos,
      })
      marcarStatus(indice, 'inserido')
      irPara(indice + 1)
    } catch (err) {
      setErroSalvar(err instanceof Error ? err.message : 'Erro desconhecido ao inserir')
    }
    setSalvando(false)
  }

  // ------------------------------------------------------------------
  // Etapa 1 — colar a lista
  // ------------------------------------------------------------------
  if (etapa === 'lista') {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Cole um ou mais CNPJs, um por linha (com ou sem máscara)
        </label>
        <textarea
          value={textoLista}
          onChange={(e) => setTextoLista(e.target.value)}
          rows={10}
          placeholder={'20.167.551/0001-51\n33000167000101\n...'}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={processarLista}
          disabled={!textoLista.trim()}
          className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Processar
        </button>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Fila terminada — resumo
  // ------------------------------------------------------------------
  if (indice >= fila.length) {
    const contagem = (status: StatusItem) => fila.filter((f) => f.status === status).length
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Lista concluída</h2>
        <ul className="mt-3 space-y-1 text-sm text-neutral-600">
          <li>✅ Inseridos: {contagem('inserido')}</li>
          <li>⏭️ Pulados: {contagem('pulado')}</li>
          <li>🗑️ Descartados: {contagem('descartado')}</li>
          <li>♻️ Já existiam: {contagem('duplicado')}</li>
          <li>⚠️ Com erro: {contagem('erro')}</li>
        </ul>
        <button
          onClick={() => {
            setEtapa('lista')
            setTextoLista('')
            setFila([])
            setIndice(0)
          }}
          className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Importar outra lista
        </button>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Etapa 2 — revisão item a item
  // ------------------------------------------------------------------
  const d = itemAtual?.dados

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">
          {indice + 1} de {fila.length}
        </span>
        <span className="font-mono text-sm text-neutral-400">{formatarCnpj(itemAtual.cnpjLimpo)}</span>
      </div>

      {itemAtual.status === 'carregando' && <p className="text-sm text-neutral-500">Consultando CNPJ...</p>}

      {itemAtual.status === 'erro' && (
        <div>
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{itemAtual.erro}</p>
          <button onClick={() => irPara(indice + 1)} className="mt-3 rounded-lg border border-neutral-200 px-4 py-2 text-sm">
            Próximo →
          </button>
        </div>
      )}

      {itemAtual.status === 'duplicado' && (
        <div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Já cadastrado como <strong>{itemAtual.existente?.nome_fantasia}</strong> (/{itemAtual.existente?.slug})
          </p>
          <button onClick={() => irPara(indice + 1)} className="mt-3 rounded-lg border border-neutral-200 px-4 py-2 text-sm">
            Próximo →
          </button>
        </div>
      )}

      {itemAtual.status === 'pronto' && d && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
            <p><strong>Razão social:</strong> {d.razaoSocial}</p>
            <p><strong>Situação:</strong> {d.situacaoCadastral}{d.situacaoCadastral !== 'ATIVA' && ' ⚠️'}</p>
            <p>
              <strong>Endereço (Receita):</strong>{' '}
              {[d.tipoLogradouro, d.logradouro].filter(Boolean).join(' ')}
              {numero && `, ${numero}`}
              {d.complemento && ` — ${d.complemento}`}
              {d.bairro && `, ${d.bairro}`}
              {`, ${d.cidade}/${d.uf}`}
              {d.cep && ` — CEP ${formatarCep(d.cep)}`}
            </p>
            <p><strong>CNAE:</strong> {d.atividadeEconomica} ({d.cnaeCodigo})</p>

            {d.socios && d.socios.length > 0 && (
              <div className="mt-2 border-t border-neutral-200 pt-2">
                <p className="font-semibold">Quadro de sócios</p>
                <ul className="mt-1 list-disc pl-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {d.socios.map((s: any, i: number) => (
                    <li key={i}>
                      {s.nome}
                      {s.qualificacao && ` — ${s.qualificacao}`}
                      {s.cpfMascarado && ` (${s.cpfMascarado})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={abrirGoogleMaps}
            className="w-fit rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Abrir no Google Maps ↗
          </button>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Nome fantasia</label>
              <input
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Número</label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="S/N"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Bairro {cidadeNome && <span className="font-normal text-neutral-400">({cidadeNome})</span>}
              </label>
              <select
                value={bairroId}
                onChange={(e) => setBairroId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Selecione (confira no Maps)</option>
                {bairros
                  .filter((b) => b.cidade_id === cidadeId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
              </select>
              {!bairroId && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  {!novoBairroAberto ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNovoBairroAberto(true)
                        setNovoBairroNome(d.bairro || '')
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar &quot;{d.bairro || 'bairro'}&quot; em {cidadeNome}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={novoBairroNome}
                        onChange={(e) => setNovoBairroNome(e.target.value)}
                        placeholder="Nome do bairro"
                        className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={criarBairroInline}
                        disabled={criandoBairro || !novoBairroNome.trim()}
                        className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                      >
                        {criandoBairro && <Loader2 className="h-3 w-3 animate-spin" />}
                        {criandoBairro ? 'Criando...' : 'Criar bairro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNovoBairroAberto(false)
                          setErroBairro(null)
                        }}
                        className="text-xs text-neutral-500 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  {erroBairro && <p className="mt-1.5 text-xs text-red-600">{erroBairro}</p>}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Tipo de estabelecimento</label>
              <select
                value={tipoEstabelecimentoId}
                onChange={(e) => setTipoEstabelecimentoId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="">Selecione o tipo</option>
                {tiposEstabelecimento.map((t) => (
                  <option key={t.id} value={t.id}>{t.icone ? `${t.icone} ` : ''}{t.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Contato</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Telefone</label>
                <input
                  value={formatarTelefone(telefone)}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(71) 9xxxx-xxxx"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">WhatsApp</label>
                <input
                  value={formatarTelefone(whatsapp)}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(71) 9xxxx-xxxx"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Instagram</label>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Site</label>
                <input
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Culinária (até 3)</label>
            <SeletorCulinariaTags todos={tiposCozinha} selecionados={culinariaIds} onChange={setCulinariaIds} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Link do Google Maps (embed)</label>
            <input
              value={linkGoogleMaps}
              onChange={(e) => setLinkGoogleMaps(e.target.value)}
              placeholder="Compartilhar → Incorporar um mapa → cole o link aqui"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Horário de funcionamento</label>
            <SeletorHorarios periodos={horarios} onChange={setHorarios} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Fotos (fachada / ambiente — até 2)</label>
            <div className="flex flex-wrap gap-3">
              {fotos.map((url, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200">
                  <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {fotos.length < 2 && (
                <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-400 hover:bg-neutral-50">
                  {enviandoFoto ? '...' : '+ Foto'}
                  <input type="file" accept="image/*" onChange={uploadFoto} className="hidden" disabled={enviandoFoto} />
                </label>
              )}
            </div>
          </div>

          {erroSalvar && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroSalvar}</p>}

          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            <button
              onClick={inserir}
              disabled={salvando || !tipoEstabelecimentoId}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {salvando ? 'Inserindo...' : 'Inserir no diretório'}
            </button>
            <button onClick={pular} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600">
              Pular
            </button>
            <button onClick={descartar} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-red-500">
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
