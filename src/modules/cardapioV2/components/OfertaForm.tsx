'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { criarOferta, atualizarOferta, type DadosOferta } from '../ofertasRepository'
import { definirRegra, removerRegra, listarRegraDaOferta } from '../regrasExibicaoRepository'
import UploadImagemV2 from './UploadImagemV2'
import AgendamentoRegraCampos, { agendamentoVazio, type AgendamentoRegra } from './AgendamentoRegraCampos'
import type { CardapioV2Oferta } from '../types'

/**
 * Criar/editar um combo — identidade (nome/foto/preço) fica em
 * cardapio_v2_ofertas; "quando está ativo" (Happy Hour recorrente ou uma
 * validade pontual) é uma regra em cardapio_v2_regras_exibicao, mesmo
 * componente (AgendamentoRegraCampos) e mesmo mecanismo que a promoção de
 * item já usa — sem agendamento nenhum duplicado aqui.
 */
export default function OfertaForm({
  estabelecimentoId,
  ofertaExistente,
  onClose,
  onSalvo,
}: {
  estabelecimentoId: string
  ofertaExistente: CardapioV2Oferta | null
  onClose: () => void
  onSalvo: () => void
}) {
  const [nome, setNome] = useState(ofertaExistente?.nome ?? '')
  const [descricao, setDescricao] = useState(ofertaExistente?.descricao ?? '')
  const [fotoUrl, setFotoUrl] = useState(ofertaExistente?.foto_url ?? '')
  const [precoDe, setPrecoDe] = useState(ofertaExistente?.preco_de?.toString() ?? '')
  const [precoPor, setPrecoPor] = useState(ofertaExistente?.preco_por?.toString() ?? '')
  const [cardLargo, setCardLargo] = useState(ofertaExistente?.card_largo ?? false)
  const [ativo, setAtivo] = useState(ofertaExistente?.ativo ?? true)
  const [alertaMinutos, setAlertaMinutos] = useState(ofertaExistente?.alerta_minutos?.toString() ?? '30')
  const [agenda, setAgenda] = useState<AgendamentoRegra>(agendamentoVazio())

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!ofertaExistente) return
    listarRegraDaOferta(ofertaExistente.id).then((regra) => {
      if (!regra) return
      setAgenda({
        diasSemana: regra.dias_semana ?? [],
        horarioDe: regra.horario_de ?? '',
        horarioAte: regra.horario_ate ?? '',
        validaAte: regra.promocao_valida_ate?.slice(0, 16) ?? '',
      })
    })
  }, [ofertaExistente])

  async function handleSalvar() {
    if (!nome.trim()) {
      setErro('Nome é obrigatório.')
      return
    }
    if (!precoPor || Number(precoPor) <= 0) {
      setErro('Informe o preço do combo.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const dados: DadosOferta = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        fotoUrl: fotoUrl || null,
        precoDe: precoDe ? Number(precoDe) : null,
        precoPor: Number(precoPor),
        cardLargo,
        ativo,
        alertaMinutos: Number(alertaMinutos) || 30,
      }
      const ofertaId = ofertaExistente ? ofertaExistente.id : await criarOferta(estabelecimentoId, dados)
      if (ofertaExistente) await atualizarOferta(ofertaExistente.id, dados)

      const temAgenda = agenda.diasSemana.length > 0 || agenda.horarioDe || agenda.horarioAte || agenda.validaAte
      if (temAgenda) {
        await definirRegra(estabelecimentoId, { oferta_id: ofertaId }, 'promocao', {
          dias_semana: agenda.diasSemana.length ? agenda.diasSemana : null,
          horario_de: agenda.horarioDe || null,
          horario_ate: agenda.horarioAte || null,
          promocao_valida_ate: agenda.validaAte ? new Date(agenda.validaAte).toISOString() : null,
        })
      } else {
        await removerRegra(estabelecimentoId, { oferta_id: ofertaId }, 'promocao')
      }

      onSalvo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar combo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ofertaExistente ? 'Editar combo' : 'Novo combo'}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">{ofertaExistente ? 'Editar combo' : 'Novo combo'}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Combo casal, Happy hour chopp"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Foto</label>
            <UploadImagemV2
              estabelecimentoId={estabelecimentoId}
              pasta="itens"
              onUpload={setFotoUrl}
              defaultImage={fotoUrl || null}
              shape="rectangle"
              label="Enviar foto"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Preço &quot;de&quot; <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <input type="number" step="0.01" value={precoDe} onChange={(e) => setPrecoDe(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Preço &quot;por&quot;</label>
              <input type="number" step="0.01" value={precoPor} onChange={(e) => setPrecoPor(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={cardLargo} onChange={(e) => setCardLargo(e.target.checked)} /> Card largo
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativo
            </label>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-neutral-600">
              Quando está ativo <span className="font-normal text-neutral-400">(vazio = sempre, sem contador)</span>
            </p>
            <AgendamentoRegraCampos valor={agenda} onChange={setAgenda} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Alerta de urgência (minutos antes do fim)</label>
            <input type="number" min={1} value={alertaMinutos} onChange={(e) => setAlertaMinutos(e.target.value)} className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : ofertaExistente ? 'Salvar alterações' : 'Criar combo'}
          </button>
        </div>
      </div>
    </div>
  )
}
