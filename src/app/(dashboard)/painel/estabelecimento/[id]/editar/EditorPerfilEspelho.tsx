'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import EstadoCarregamento from '../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../gerenciar/useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../gerenciar/CabecalhoGerenciar'
import CabecalhoPerfilPublico from '@/components/public/CabecalhoPerfilPublico'
import SecaoSobre from '@/components/public/SecaoSobre'
import SecaoGaleria from '@/components/public/SecaoGaleria'
import SecaoHorarios from '@/components/public/SecaoHorarios'
import SecaoLocalizacao from '@/components/public/SecaoLocalizacao'
import SecaoComodidades from '@/components/public/SecaoComodidades'
import SecaoContato from '@/components/public/SecaoContato'
import { TraducaoProvider } from '@/components/public/TraducaoCardapio'
import { resolverSecoesEstabelecimento } from '@/lib/secoesEstabelecimento'
import { montarEnderecoCompleto, resolverLinksMapa, temComodidade } from '@/lib/enderecoEstabelecimento'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import { horarioAtualSalvador } from '@/lib/horarioSalvador'
import PontoEditavel from './PontoEditavel'
import ModalEditarCabecalho from './ModalEditarCabecalho'
import ModalEditarSobre from './ModalEditarSobre'
import ModalEditarContato from './ModalEditarContato'
import ModalEditarComodidades from './ModalEditarComodidades'
import ModalEditarHorarios from './ModalEditarHorarios'
import ModalEditarGaleria from './ModalEditarGaleria'

type ModalAberto = 'cabecalho' | 'sobre' | 'contato' | 'comodidades' | 'horarios' | 'galeria' | null

interface DadosEspelho {
  cidadeNome: string | null
  bairroNome: string | null
  tipoEstabelecimentoNome: string | null
  culinarias: string[]
  // Mesmo formato solto (sem interface própria) que a página pública usa
  // pra esse mesmo dado — SecaoHorarios/isEstabelecimentoAberto já esperam
  // esse shape informalmente, uma interface própria aqui só brigaria com
  // os tipos (mais restritos do que o schema real, que aceita null) deles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  horarios: any[]
  ordemSecoes: string[]
  secaoAtiva: (chave: string) => boolean
}

/**
 * Espelho clicável do perfil público — ver plano "Editor de Perfil V1".
 * Renderiza os MESMOS componentes que
 * `src/app/(public)/[...slug]/page.tsx` usa, na mesma ordem, cada seção
 * editável envolta em `PontoEditavel`. Sem modal ainda nesta primeira
 * versão — só o espelho em modo leitura, pra validar que bate visualmente
 * com a página pública antes de acrescentar a edição de fato.
 *
 * `SecaoAvaliacoesGoogle` (async Server Component, não pode ser filho de
 * Client Component) e `SecaoPromocoes` (dado gerido pelo cardápio, não
 * pelo perfil) ficam de fora do espelho de propósito — não são editáveis
 * por aqui de qualquer forma.
 */
export default function EditorPerfilEspelho({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    estabelecimento,
    usuarioNome,
    usuarioLogadoId,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
  } = useEstabelecimentoGerenciar(id)

  const [dados, setDados] = useState<DadosEspelho | null>(null)
  const [modalAberto, setModalAberto] = useState<ModalAberto>(null)

  // Sem estado otimista por seção — recarrega a página inteira depois de
  // salvar. Mais simples que sincronizar cache local com 6 modais
  // diferentes, e garante que o espelho reflete o dado real do banco.
  function fecharEAtualizar() {
    setModalAberto(null)
    window.location.reload()
  }

  useEffect(() => {
    if (!estabelecimento) return
    const supabase = createClient()

    async function carregar() {
      const [{ data: extra }, { data: horariosRows }, { data: secoesConfig }] = await Promise.all([
        supabase
          .from('estabelecimentos')
          .select('estabelecimento_tipos_cozinha(tipos_cozinha(nome)), cidades(nome), bairros(nome), tipos_estabelecimento(nome)')
          .eq('id', id)
          .single(),
        supabase.from('horarios_funcionamento').select('*').eq('estabelecimento_id', id).order('dia_semana'),
        supabase.from('platform_settings').select('value').eq('key', 'secoes_estabelecimento').maybeSingle(),
      ])

      const { secaoAtiva, ordemSecoes } = resolverSecoesEstabelecimento(secoesConfig?.value)

      // supabase-js infere as relações do select acima como array sem um
      // schema gerado pra apontar que são N:1 — o formato real devolvido
      // (confirmado pelo mesmo padrão já em produção na página pública,
      // src/app/(public)/[...slug]/page.tsx) é objeto único, não array.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extraTipado = extra as any

      setDados({
        cidadeNome: extraTipado?.cidades?.nome ?? null,
        bairroNome: extraTipado?.bairros?.nome ?? null,
        tipoEstabelecimentoNome: extraTipado?.tipos_estabelecimento?.nome ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        culinarias: (extraTipado?.estabelecimento_tipos_cozinha ?? []).map((v: any) => v.tipos_cozinha?.nome).filter(Boolean),
        horarios: horariosRows ?? [],
        ordemSecoes,
        secaoAtiva,
      })
    }

    carregar()
  }, [estabelecimento, id])

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  if (!dados) {
    return <div className="p-8 text-center text-sm text-neutral-400">Carregando…</div>
  }

  // Mesmo formato de `est` que a página pública monta, pra passar direto
  // pros mesmos componentes de exibição sem adaptar prop a prop.
  const est = {
    ...estabelecimento,
    tipos_estabelecimento: dados.tipoEstabelecimentoNome ? { nome: dados.tipoEstabelecimentoNome } : null,
    estabelecimento_tipos_cozinha: dados.culinarias.map((nome) => ({ tipos_cozinha: { nome } })),
  }

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const galeriaFotos: string[] = estabelecimento.galeria_fotos || []
  const statusAberto = isEstabelecimentoAberto(dados.horarios)
  const { diaSemana: diaSemanaHoje } = horarioAtualSalvador()
  const enderecoCompleto = montarEnderecoCompleto(estabelecimento, dados.bairroNome, dados.cidadeNome ?? 'Salvador')
  const { mapUrl, linkAbrirMapa } = resolverLinksMapa(estabelecimento, enderecoCompleto)
  const estabelecimentoTemComodidade = temComodidade(estabelecimento)

  return (
    <div className="min-h-screen bg-neutral-50">
      <CabecalhoGerenciar
        estabelecimento={estabelecimento}
        usuarioNome={usuarioNome}
        usuarioLogadoId={usuarioLogadoId}
        ehDonoOuGerente={ehDonoOuGerente}
        podeEditar={podeEditar}
        aoVoltar={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
        tituloPagina={{ icone: <Pencil className="h-full w-full" />, texto: 'Editar perfil' }}
        contaAberta={false}
        onAbrirConta={() => {}}
        onFecharConta={() => {}}
      />

      <TraducaoProvider slug={estabelecimento.slug} idiomasAtivos={[]} traducoes={[]} traducoesInterface={[]}>
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <p className="mb-4 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-700">
            Este é um espelho da sua página pública — passe o mouse e clique em qualquer seção pra editar.
          </p>

          <PontoEditavel label="cabeçalho" onEditar={() => setModalAberto('cabecalho')}>
            <CabecalhoPerfilPublico
              est={est}
              nomeExibicao={nomeExibicao}
              galeriaFotos={galeriaFotos}
              statusAberto={statusAberto}
              capaAtiva={dados.secaoAtiva('capa')}
              idiomasAtivos={[]}
            />
          </PontoEditavel>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
            <div className="space-y-8 p-6">
              {dados.ordemSecoes.map((chave) => {
                if (!dados.secaoAtiva(chave)) return null

                switch (chave) {
                  case 'sobre':
                    return (
                      <PontoEditavel key={chave} label="endereço" onEditar={() => setModalAberto('sobre')}>
                        <SecaoSobre
                          tipoLogradouro={estabelecimento.tipo_logradouro}
                          endereco={estabelecimento.endereco}
                          numero={estabelecimento.numero}
                          bairro={dados.bairroNome}
                          cidade={dados.cidadeNome ?? 'Salvador'}
                        />
                      </PontoEditavel>
                    )

                  case 'galeria':
                    return (
                      <PontoEditavel key={chave} label="galeria" onEditar={() => setModalAberto('galeria')}>
                        <SecaoGaleria fotos={galeriaFotos} nome={nomeExibicao} />
                      </PontoEditavel>
                    )

                  case 'horarios':
                    return (
                      <PontoEditavel key={chave} label="horários" onEditar={() => setModalAberto('horarios')}>
                        <SecaoHorarios horarios={dados.horarios} diaSemanaHoje={diaSemanaHoje} />
                      </PontoEditavel>
                    )

                  case 'localizacao':
                    // Deriva do endereço (editado na seção "Sobre") — sem
                    // ponto de edição próprio.
                    return <SecaoLocalizacao key={chave} mapUrl={mapUrl} linkAbrirMapa={linkAbrirMapa} />

                  case 'comodidades':
                    if (!estabelecimentoTemComodidade) return null
                    return (
                      <PontoEditavel key={chave} label="comodidades" onEditar={() => setModalAberto('comodidades')}>
                        <SecaoComodidades
                          aceitaPets={estabelecimento.aceita_pets}
                          estacionamento={estabelecimento.estacionamento}
                          acessibilidade={estabelecimento.acessibilidade}
                        />
                      </PontoEditavel>
                    )

                  case 'contato':
                    return (
                      <PontoEditavel key={chave} label="contato" onEditar={() => setModalAberto('contato')}>
                        <SecaoContato telefone={estabelecimento.telefone} whatsapp={estabelecimento.whatsapp} instagram={estabelecimento.instagram} />
                      </PontoEditavel>
                    )

                  default:
                    return null
                }
              })}
            </div>
          </div>
        </div>
      </TraducaoProvider>

      {modalAberto === 'cabecalho' && (
        <ModalEditarCabecalho estabelecimento={estabelecimento} onFechar={() => setModalAberto(null)} onSalvo={fecharEAtualizar} />
      )}
      {modalAberto === 'sobre' && (
        <ModalEditarSobre estabelecimento={estabelecimento} onFechar={() => setModalAberto(null)} onSalvo={fecharEAtualizar} />
      )}
      {modalAberto === 'contato' && (
        <ModalEditarContato estabelecimento={estabelecimento} onFechar={() => setModalAberto(null)} onSalvo={fecharEAtualizar} />
      )}
      {modalAberto === 'comodidades' && (
        <ModalEditarComodidades estabelecimento={estabelecimento} onFechar={() => setModalAberto(null)} />
      )}
      {modalAberto === 'horarios' && <ModalEditarHorarios estabelecimentoId={id} onFechar={() => setModalAberto(null)} />}
      {modalAberto === 'galeria' && (
        <ModalEditarGaleria estabelecimentoId={id} fotosIniciais={galeriaFotos} onFechar={() => setModalAberto(null)} onSalvo={fecharEAtualizar} />
      )}
    </div>
  )
}
