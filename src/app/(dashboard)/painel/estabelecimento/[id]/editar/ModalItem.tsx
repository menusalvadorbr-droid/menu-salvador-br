'use client'

import { useState } from 'react'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'
import { Toggle } from './CardapioUI'
import BlocoTraducoes from './BlocoTraducoes'
import VariacoesEditor from './VariacoesEditor'
import ComplementosEditor from './ComplementosEditor'
import type { Alergeno, Categoria } from './cardapioTipos'

// ─────────────────────────────────────────────
// MODAL DE EDIÇÃO
// ─────────────────────────────────────────────
export default function ModalItem({
  item, categorias, alergenos,
  fNome, setFNome, fDesc, setFDesc,
  fPreco, setFPreco, fCodigo, setFCodigo,
  fCatId, setFCatId, fDisponivel, setFDisponivel,
  fDelivery, setFDelivery, fotoUrl, setFotoUrl,
  alergenosSel, toggleAlerg,
  salvando, erro, onSalvar, onFechar,
  fPromo, setFPromo,
  fPromoDesc, setFPromoDesc,
  fPromoTipo, setFPromoTipo,
  fPromoInicio, setFPromoInicio,
  fPromoFim, setFPromoFim,
  variacoesAtivado, variacoes, adicionarVariacao, atualizarVariacao, removerVariacao,
  mostrarVariacoes, setMostrarVariacoes,
  complementosAtivado, gruposEstabelecimento, gruposVinculadosIds, toggleVinculoGrupo,
  grupoEditandoIndex, setGrupoEditandoIndex, iniciarNovoGrupo, atualizarCampoGrupoEditando,
  adicionarOpcaoNoGrupoEditando, atualizarOpcaoNoGrupoEditando, removerOpcaoNoGrupoEditando,
  salvarGrupoEstabelecimento, excluirGrupoEstabelecimento, salvandoGrupo, itensDisponiveis,
  mostrarGrupos, setMostrarGrupos,
  opcoesExtraExpandidas, toggleExtraDaOpcao, gruposExtrasPorOpcao, toggleGrupoExtra,
  idiomasAtivos, traducoesItem, atualizarTraducaoItem,
}: any) {
  const [mostrarTraducoes, setMostrarTraducoes] = useState(false)
  // calcula preview do preço promocional em tempo real
  const precoBase = parseFloat((fPreco || '0').replace(',', '.')) || 0
  const descNum   = parseFloat((fPromoDesc || '0').replace(',', '.')) || 0
  const precoPromoPreview = fPromo && descNum > 0
    ? (fPromoTipo === 'pct'
        ? precoBase * (1 - descNum / 100)
        : precoBase - descNum)
    : null
  const algSelecionados = alergenos
    .filter((a: Alergeno) => alergenosSel.includes(a.id))
    .map((a: Alergeno) => `${a.icone} ${a.nome}`)
    .join(' · ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {item ? 'Editar item' : 'Novo item'}
            </h2>
            {item && <p className="text-xs text-gray-400 mt-0.5">{item.nome}</p>}
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* CORPO SCROLLÁVEL */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {erro}
            </div>
          )}

          {/* FOTO */}
          <ImageUpload
            onUpload={setFotoUrl}
            onRemove={() => setFotoUrl('')}
            currentImage={fotoUrl || null}
            label="Foto do item"
            aspectRatio="square"
            maxSize={2}
          />

          {/* CÓDIGO + CATEGORIA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                value={fCodigo}
                onChange={e => setFCodigo(e.target.value)}
                placeholder="ex: 042"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1">Visível no cardápio e usado pelo garçom</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Categoria <span className="text-red-400">*</span>
              </label>
              <select
                value={fCatId}
                onChange={e => setFCatId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              >
                <option value="">Selecionar…</option>
                {categorias.map((c: Categoria) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* NOME */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome do item <span className="text-red-400">*</span>
            </label>
            <input
              value={fNome}
              onChange={e => setFNome(e.target.value)}
              placeholder="Nome do item"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea
              value={fDesc}
              onChange={e => setFDesc(e.target.value)}
              placeholder="Ingredientes, modo de preparo, acompanhamentos…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          {/* PREÇO */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Preço <span className="text-red-400">*</span>
              {variacoesAtivado && variacoes.length > 0 && (
                <span className="text-gray-400 font-normal ml-1">(usado como &quot;a partir de&quot; na listagem)</span>
              )}
            </label>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                R$
              </span>
              <input
                value={fPreco}
                onChange={e => setFPreco(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
          </div>

          <VariacoesEditor
            ativado={variacoesAtivado}
            mostrar={mostrarVariacoes}
            setMostrar={setMostrarVariacoes}
            variacoes={variacoes}
            adicionarVariacao={adicionarVariacao}
            atualizarVariacao={atualizarVariacao}
            removerVariacao={removerVariacao}
          />

          <ComplementosEditor
            ativado={complementosAtivado}
            mostrar={mostrarGrupos}
            setMostrar={setMostrarGrupos}
            gruposEstabelecimento={gruposEstabelecimento}
            gruposVinculadosIds={gruposVinculadosIds}
            toggleVinculoGrupo={toggleVinculoGrupo}
            grupoEditandoIndex={grupoEditandoIndex}
            setGrupoEditandoIndex={setGrupoEditandoIndex}
            atualizarCampoGrupoEditando={atualizarCampoGrupoEditando}
            adicionarOpcaoNoGrupoEditando={adicionarOpcaoNoGrupoEditando}
            atualizarOpcaoNoGrupoEditando={atualizarOpcaoNoGrupoEditando}
            removerOpcaoNoGrupoEditando={removerOpcaoNoGrupoEditando}
            salvarGrupoEstabelecimento={salvarGrupoEstabelecimento}
            excluirGrupoEstabelecimento={excluirGrupoEstabelecimento}
            salvandoGrupo={salvandoGrupo}
            itensDisponiveis={itensDisponiveis}
            itemAtualId={item?.id}
            opcoesExtraExpandidas={opcoesExtraExpandidas}
            toggleExtraDaOpcao={toggleExtraDaOpcao}
            gruposExtrasPorOpcao={gruposExtrasPorOpcao}
            toggleGrupoExtra={toggleGrupoExtra}
            iniciarNovoGrupo={iniciarNovoGrupo}
          />

          {/* ALERGENOS */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Alérgenos
              <span className="text-gray-400 font-normal ml-1">(ANVISA RDC 26/2015)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {alergenos.map((a: Alergeno) => {
                const sel = alergenosSel.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAlerg(a.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border-2 transition font-medium ${
                      sel
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm leading-none">{a.icone}</span>
                    {a.nome}
                    {sel && <span className="text-red-500 text-xs ml-0.5">✓</span>}
                  </button>
                )
              })}
            </div>
            {alergenosSel.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {alergenosSel.length} selecionado{alergenosSel.length > 1 ? 's' : ''}: {algSelecionados}
              </p>
            )}
          </div>

          {/* TRADUÇÕES (EN/FR/ES) — só aparece com algum idioma ativado em Configurações → Idiomas */}
          {idiomasAtivos.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-3">
              <button
                type="button"
                onClick={() => setMostrarTraducoes((v) => !v)}
                className="flex w-full items-center justify-between text-xs font-medium text-gray-600"
              >
                🌐 Traduções
                <span className="text-gray-400">{mostrarTraducoes ? '▲' : '▼'}</span>
              </button>
              {mostrarTraducoes && (
                <div className="mt-3">
                  <BlocoTraducoes
                    idiomasAtivos={idiomasAtivos}
                    campos={['nome', 'descricao']}
                    valores={traducoesItem}
                    onChange={atualizarTraducaoItem}
                  />
                </div>
              )}
            </div>
          )}

          {/* TOGGLES DE STATUS */}
          <div className="flex flex-wrap gap-5 pt-2 border-t border-gray-100">
            <Toggle checked={fDisponivel} onChange={setFDisponivel} label="Disponível no cardápio" />
            <Toggle checked={fDelivery}   onChange={setFDelivery}   label="Disponível para delivery" />
            <Toggle checked={fPromo}      onChange={setFPromo}      label="Em promoção 🏷️" />
          </div>

          {/* CONFIGURAÇÃO DE PROMOÇÃO (inline, aparece quando toggle ativo) */}
          {fPromo && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-orange-700">🔥 Configurar promoção</p>

              {/* Tipo */}
              <div className="flex gap-2">
                {(['pct', 'fixed'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setFPromoTipo(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                      fPromoTipo === t
                        ? 'border-orange-500 bg-orange-100 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}>
                    {t === 'pct' ? '% Percentual' : 'R$ Valor fixo'}
                  </button>
                ))}
              </div>

              {/* Atalhos percentual */}
              {fPromoTipo === 'pct' && (
                <div className="flex gap-1.5">
                  {[10, 15, 20, 30, 50].map(p => (
                    <button key={p} type="button"
                      onClick={() => setFPromoDesc(p.toString())}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium border transition ${
                        fPromoDesc === p.toString()
                          ? 'bg-orange-200 border-orange-400 text-orange-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}>
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              {/* Valor + preview */}
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    value={fPromoDesc}
                    onChange={e => setFPromoDesc(e.target.value)}
                    placeholder={fPromoTipo === 'pct' ? 'ex: 20' : 'ex: 10,00'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {fPromoTipo === 'pct' ? '%' : 'R$'}
                  </span>
                </div>
                {precoPromoPreview !== null && precoPromoPreview > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400 line-through">R$ {precoBase.toFixed(2).replace('.', ',')}</div>
                    <div className="text-base font-bold text-orange-600">R$ {precoPromoPreview.toFixed(2).replace('.', ',')}</div>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Início</label>
                  <input type="date" value={fPromoInicio} onChange={e => setFPromoInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Término <span className="text-gray-400">(opcional)</span></label>
                  <input type="date" value={fPromoFim} onChange={e => setFPromoFim(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                </div>
              </div>
              {fPromoFim && <p className="text-xs text-orange-600">Desativa automaticamente após {fPromoFim}.</p>}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSalvar}
            disabled={salvando}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {salvando
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando…</>
              : item ? '✓ Salvar alterações' : '✓ Criar item'
            }
          </button>
        </div>

      </div>
    </div>
  )
}
