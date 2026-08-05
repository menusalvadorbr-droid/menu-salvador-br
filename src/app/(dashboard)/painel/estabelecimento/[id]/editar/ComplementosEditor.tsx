import type { GrupoComplemento, ItemCardapio, OpcaoComplemento } from './cardapioTipos'

// ─────────────────────────────────────────────
// GRUPOS DE COMPLEMENTOS (fase 2 do módulo cardápio) — mesmo editor
// progressivo do VariacoesEditor: fechado por padrão atrás de um link,
// abre sozinho quando o item já tem grupo vinculado (`mostrar`, controlado
// pelo ModalItem).
// ─────────────────────────────────────────────
export default function ComplementosEditor({
  ativado, mostrar, setMostrar,
  gruposEstabelecimento, gruposVinculadosIds, toggleVinculoGrupo,
  grupoEditandoIndex, setGrupoEditandoIndex, atualizarCampoGrupoEditando,
  adicionarOpcaoNoGrupoEditando, atualizarOpcaoNoGrupoEditando, removerOpcaoNoGrupoEditando,
  salvarGrupoEstabelecimento, excluirGrupoEstabelecimento, salvandoGrupo,
  itensDisponiveis, itemAtualId,
  opcoesExtraExpandidas, toggleExtraDaOpcao, gruposExtrasPorOpcao, toggleGrupoExtra,
  iniciarNovoGrupo,
}: {
  ativado: boolean
  mostrar: boolean
  setMostrar: (v: boolean) => void
  gruposEstabelecimento: GrupoComplemento[]
  gruposVinculadosIds: string[]
  toggleVinculoGrupo: (grupoId: string) => void
  grupoEditandoIndex: number | null
  setGrupoEditandoIndex: (i: number | null) => void
  atualizarCampoGrupoEditando: (campo: 'nome' | 'selecaoMinima' | 'selecaoMaxima', valor: string) => void
  adicionarOpcaoNoGrupoEditando: () => void
  atualizarOpcaoNoGrupoEditando: (opcaoIndex: number, campo: 'itemId' | 'precoAdicional' | 'exibirPreco', valor: string | boolean) => void
  removerOpcaoNoGrupoEditando: (opcaoIndex: number) => void
  salvarGrupoEstabelecimento: (index: number) => void
  excluirGrupoEstabelecimento: (index: number) => void
  salvandoGrupo: boolean
  itensDisponiveis: ItemCardapio[]
  itemAtualId: string | undefined
  opcoesExtraExpandidas: string[]
  toggleExtraDaOpcao: (opcaoId: string) => void
  gruposExtrasPorOpcao: Record<string, string[]>
  toggleGrupoExtra: (opcaoId: string, grupoId: string) => void
  iniciarNovoGrupo: () => void
}) {
  if (!ativado) return null

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="text-xs font-medium text-orange-600 hover:underline"
      >
        + Vincular grupo de complementos
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        Grupos de complementos <span className="text-gray-400 font-normal">(ex: Guarnições — compartilhado entre vários itens)</span>
      </label>

      {gruposEstabelecimento.map((g, gi) => {
        const vinculado = g.id ? gruposVinculadosIds.includes(g.id) : false
        const editando = grupoEditandoIndex === gi

        return (
          <div key={g.id || `novo-${gi}`} className="rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 p-2.5">
              {g.id && (
                <input
                  type="checkbox"
                  checked={vinculado}
                  onChange={() => toggleVinculoGrupo(g.id!)}
                  className="w-4 h-4 accent-orange-500"
                  title="Usar este grupo neste item"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800">{g.nome || '(sem nome)'}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {g.opcoes.length} opç{g.opcoes.length === 1 ? 'ão' : 'ões'} · {parseInt(g.selecaoMinima) > 0 ? 'obrigatório' : 'opcional'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGrupoEditandoIndex(editando ? null : gi)}
                className="text-xs font-medium text-orange-600 hover:underline px-1"
              >
                {editando ? 'Fechar' : 'Editar'}
              </button>
              <button
                type="button"
                onClick={() => excluirGrupoEstabelecimento(gi)}
                className="text-gray-400 hover:text-red-500 transition px-1"
                title="Excluir grupo (afeta todos os itens que usam)"
              >
                🗑️
              </button>
            </div>

            {editando && (
              <div className="p-3 pt-0 space-y-2 border-t border-gray-200">
                <p className="text-xs text-amber-600 -mb-1">
                  ⚠️ Editar aqui afeta todos os itens que usam este grupo, não só este.
                </p>
                <input
                  value={g.nome}
                  onChange={(e) => atualizarCampoGrupoEditando('nome', e.target.value)}
                  placeholder="Nome do grupo (ex: Guarnições)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                />
                <div className="flex gap-3 items-center text-xs text-gray-500">
                  <label className="flex items-center gap-1.5">
                    Mín. escolhas
                    <input
                      type="number"
                      min={0}
                      value={g.selecaoMinima}
                      onChange={(e) => atualizarCampoGrupoEditando('selecaoMinima', e.target.value)}
                      className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    Máx. escolhas
                    <input
                      type="number"
                      min={1}
                      value={g.selecaoMaxima}
                      onChange={(e) => atualizarCampoGrupoEditando('selecaoMaxima', e.target.value)}
                      className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                    />
                  </label>
                </div>

                <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
                  {g.opcoes.map((o: OpcaoComplemento, oi: number) => (
                    <div key={oi}>
                    <div className="flex gap-2 items-center">
                      <select
                        value={o.itemId}
                        onChange={(e) => atualizarOpcaoNoGrupoEditando(oi, 'itemId', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                      >
                        <option value="">Selecione um item do cardápio…</option>
                        {itensDisponiveis
                          .filter((it) => it.id !== itemAtualId)
                          .map((it) => (
                            <option key={it.id} value={it.id}>{it.nome}</option>
                          ))}
                      </select>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">+R$</span>
                        <input
                          value={o.precoAdicional}
                          onChange={(e) => atualizarOpcaoNoGrupoEditando(oi, 'precoAdicional', e.target.value)}
                          placeholder="0,00"
                          className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap" title="Se desmarcado, o preço não aparece no cardápio público, mesmo que tenha um valor definido">
                        <input
                          type="checkbox"
                          checked={o.exibirPreco}
                          onChange={(e) => atualizarOpcaoNoGrupoEditando(oi, 'exibirPreco', e.target.checked)}
                          className="rounded"
                        />
                        Mostrar preço
                      </label>
                      <button
                        type="button"
                        onClick={() => removerOpcaoNoGrupoEditando(oi)}
                        className="text-gray-400 hover:text-red-500 transition px-1"
                        title="Remover opção"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Grupo obrigatório extra (opcao_grupo_complemento) — só
                        depois da opção salva, já que a relação aponta pro id
                        dela. Ex: escolher "Carne X" libera "Ponto da carne". */}
                    {o.id ? (
                      <div className="pl-1 mt-1">
                        <button
                          type="button"
                          onClick={() => toggleExtraDaOpcao(o.id!)}
                          className="text-[11px] font-medium text-orange-600 hover:underline"
                        >
                          {opcoesExtraExpandidas.includes(o.id) ? 'Fechar grupo extra' : '+ Vincular grupo obrigatório extra'}
                        </button>
                        {opcoesExtraExpandidas.includes(o.id) && (
                          <div className="mt-1 space-y-1 rounded-lg border border-gray-200 bg-white p-2">
                            <p className="text-[11px] text-gray-500">
                              Grupo(s) que só aparecem pro cliente quando ele escolher &quot;{o.itemNome || 'esta opção'}&quot;.
                            </p>
                            {gruposEstabelecimento.filter((outro) => outro.id && outro.id !== g.id).length === 0 ? (
                              <p className="text-[11px] text-gray-400">Crie outro grupo primeiro pra poder vincular aqui.</p>
                            ) : (
                              gruposEstabelecimento
                                .filter((outro) => outro.id && outro.id !== g.id)
                                .map((outro) => {
                                  const vinculadoExtra = (gruposExtrasPorOpcao[o.id!] || []).includes(outro.id!)
                                  return (
                                    <label key={outro.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <input
                                        type="checkbox"
                                        checked={vinculadoExtra}
                                        onChange={() => toggleGrupoExtra(o.id!, outro.id!)}
                                        className="w-3.5 h-3.5 accent-orange-500"
                                      />
                                      {outro.nome || '(sem nome)'}
                                    </label>
                                  )
                                })
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="pl-1 mt-1 text-[11px] text-gray-400">
                        Salve o grupo pra poder vincular um grupo extra a esta opção.
                      </p>
                    )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={adicionarOpcaoNoGrupoEditando}
                    className="text-xs font-medium text-orange-600 hover:underline"
                  >
                    + Adicionar opção
                  </button>
                  {itensDisponiveis.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Cadastre os itens (ex: as guarnições) no cardápio primeiro pra poder escolhê-los aqui.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => salvarGrupoEstabelecimento(gi)}
                  disabled={salvandoGrupo}
                  className="text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg px-3 py-1.5 disabled:opacity-50"
                >
                  {salvandoGrupo ? 'Salvando…' : g.id ? 'Salvar alterações do grupo' : 'Criar grupo'}
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={iniciarNovoGrupo}
        className="text-xs font-medium text-orange-600 hover:underline"
      >
        + Criar grupo de complementos
      </button>
    </div>
  )
}
