import Image from 'next/image'
import StatusPill from './StatusPill'
import { TextoInterface, SeletorIdioma } from './TraducaoCardapio'
import type { isEstabelecimentoAberto } from '@/lib/statusAberto'

/**
 * Capa + card principal (logo, nome, tipo/culinária, status, descrição,
 * banner de reivindicar) da página de perfil público — extraído de
 * `src/app/(public)/[...slug]/page.tsx` (era JSX inline ali) pra poder ser
 * reaproveitado também pelo editor de perfil (espelho clicável), sem
 * duplicar o bloco em dois arquivos. Puramente presentacional, mesmo
 * visual de antes, nenhum comportamento novo.
 */
export default function CabecalhoPerfilPublico({
  est,
  nomeExibicao,
  galeriaFotos,
  statusAberto,
  capaAtiva,
  idiomasAtivos,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  est: any
  nomeExibicao: string
  galeriaFotos: string[]
  statusAberto: ReturnType<typeof isEstabelecimentoAberto>
  capaAtiva: boolean
  idiomasAtivos: string[]
}) {
  return (
    <>
      {/* Hero – foto de capa dedicada (mesma fonte de verdade usada no
          cardápio simples e nas listagens). Cai pra primeira foto da
          galeria se o estabelecimento ainda não subiu uma capa própria.
          Controlado pelo toggle "Capa" em /admin/configuracoes → Seções
          da página do estabelecimento. */}
      {capaAtiva && (est.foto_capa || galeriaFotos.length > 0) && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl md:h-80">
          <Image src={est.foto_capa || galeriaFotos[0]} alt={nomeExibicao} fill sizes="(max-width: 768px) 100vw, 1024px" className="object-cover" />
        </div>
      )}

      {/* Card principal */}
      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        {idiomasAtivos.length > 0 && (
          <div className="mb-2 flex justify-end">
            <SeletorIdioma idiomasAtivos={idiomasAtivos} />
          </div>
        )}
        <div className="flex items-start gap-4">
          {est.logo_url && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-200">
              <Image src={est.logo_url} alt={nomeExibicao} fill sizes="64px" className="object-cover" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              <span>{est.tipos_estabelecimento?.nome || <TextoInterface chave="tipo_estabelecimento_fallback">Restaurante</TextoInterface>}</span>
              {(est.estabelecimento_tipos_cozinha || [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((v: any) => v.tipos_cozinha?.nome)
                .filter(Boolean)
                .map((nome: string) => (
                  <span key={nome} className="flex items-center gap-2">
                    <span className="text-neutral-300">•</span>
                    <span>{nome}</span>
                  </span>
                ))}
              {statusAberto.exibir && statusAberto.estado && (
                <StatusPill aberto={statusAberto.aberto} estado={statusAberto.estado} horaAbertura={statusAberto.horaAbertura} />
              )}
            </div>
          </div>
        </div>
        {est.descricao && (
          <div
            className="prose prose-sm mt-4 max-w-none text-sm leading-relaxed text-neutral-700"
            dangerouslySetInnerHTML={{ __html: est.descricao }}
          />
        )}
        {!est.owner_user_id && (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand-primary)]/30 px-4 py-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 6%, white)' }}
          >
            <p className="text-sm text-neutral-800">
              <strong><TextoInterface chave="reivindicar_titulo">Esse é o seu estabelecimento?</TextoInterface></strong>{' '}
              <TextoInterface chave="reivindicar_texto_perfil">
                Reivindique o perfil para editar informações, fotos e cardápio.
              </TextoInterface>
            </p>
            <a
              href={`/estabelecimentos/novo?cnpj=${est.cnpj}`}
              className="shrink-0 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            >
              <TextoInterface chave="reivindicar_botao">Reivindicar</TextoInterface>
            </a>
          </div>
        )}
      </div>
    </>
  )
}
