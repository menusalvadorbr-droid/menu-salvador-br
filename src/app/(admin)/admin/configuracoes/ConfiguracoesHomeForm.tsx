'use client'

import { useState, useTransition } from 'react'
import { salvarConfiguracoesHome } from './actions'

export interface ConfiguracoesHome {
  hero_ativado: boolean
  busca_ativado: boolean
  promocoes_ativado: boolean
  explorar_bairro_ativado: boolean
  categorias_populares_ativado: boolean
  recomendados_ativado: boolean
  grid_estabelecimentos_ativado: boolean
  filtros_ativado: boolean
  cta_donos_ativado: boolean
  botao_flutuante_ativado: boolean
}

const SECOES: { chave: keyof ConfiguracoesHome; label: string; descricao: string }[] = [
  { chave: 'hero_ativado', label: 'Banner principal', descricao: 'Faixa de topo com o título e os números do dia' },
  { chave: 'busca_ativado', label: 'Busca por texto', descricao: 'Campo de busca livre (nome, bairro, culinária) dentro do banner' },
  { chave: 'promocoes_ativado', label: 'Carrossel de promoções', descricao: 'Itens com desconto ativo, logo abaixo do banner' },
  { chave: 'explorar_bairro_ativado', label: 'Explorar por bairro', descricao: 'Grid de bairros com contagem real de estabelecimentos' },
  { chave: 'categorias_populares_ativado', label: 'Categorias populares', descricao: 'Vitrine de tipos de culinária com mais estabelecimentos' },
  { chave: 'recomendados_ativado', label: 'Recomendados', descricao: 'Estabelecimentos marcados como destaque, com selo de curadoria' },
  { chave: 'grid_estabelecimentos_ativado', label: 'Grid de estabelecimentos', descricao: 'Lista geral de cards — desligar esconde praticamente a home inteira' },
  { chave: 'filtros_ativado', label: 'Filtros (bairro e culinária)', descricao: 'Só tem efeito se o grid acima estiver ligado' },
  { chave: 'cta_donos_ativado', label: 'CTA para donos', descricao: 'Seção de rodapé convidando donos a cadastrar o estabelecimento' },
  { chave: 'botao_flutuante_ativado', label: 'Botão flutuante', descricao: '"Cadastre seu negócio", fixo no canto da tela (mobile)' },
]

/**
 * A leitura dessas 5 flags já existia em HomePage() (tabela
 * configuracoes_home, linha única id=true), mas não havia nenhuma tela
 * de admin pra escrever nelas — o super_admin não tinha como realmente
 * ativar/desativar seção nenhuma, mesmo o código já suportando isso.
 */
export default function ConfiguracoesHomeForm({ configInicial }: { configInicial: ConfiguracoesHome }) {
  const [config, setConfig] = useState(configInicial)
  const [isPending, startTransition] = useTransition()
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function toggle(chave: keyof ConfiguracoesHome) {
    const nova = { ...config, [chave]: !config[chave] }
    setConfig(nova)
    setErro(null)
    startTransition(async () => {
      try {
        await salvarConfiguracoesHome(nova)
        setSalvo(true)
        setTimeout(() => setSalvo(false), 2000)
      } catch (e: any) {
        setConfig(config) // desfaz a mudança visual se salvar falhar
        setErro(e.message || 'Erro ao salvar.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {SECOES.map((secao) => {
        const ativa = config[secao.chave]
        return (
          <div
            key={secao.chave}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5"
          >
            <div className="flex-1">
              <p className={`text-sm ${ativa ? 'text-neutral-900' : 'text-neutral-400'}`}>{secao.label}</p>
              <p className="text-xs text-neutral-400">{secao.descricao}</p>
            </div>

            <button
              type="button"
              onClick={() => toggle(secao.chave)}
              disabled={isPending}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
                ativa ? 'bg-green-500' : 'bg-neutral-300'
              }`}
              aria-pressed={ativa}
              aria-label={`Ativar ou desativar ${secao.label}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  ativa ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        )
      })}
      {salvo && <span className="text-xs text-green-600">Salvo ✓</span>}
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  )
}
