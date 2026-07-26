import Link from 'next/link'

const COR_TERRACOTA = '#C1541F'
const COR_AZULEJO = '#2B5C73'
const COR_FUNDO = '#FBF7F0'
const COR_TEXTO = '#2A2420'

/**
 * Padrão de losango em baixa opacidade — mesmo motivo de azulejo já
 * usado no restante do painel, aqui só como pano de fundo discreto
 * atrás do botão principal.
 */
function MotivoAzulejo() {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className="h-40 w-40 opacity-[0.08]">
      <defs>
        <pattern id="azulejo-boas-vindas" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 2 L38 20 L20 38 L2 20 Z" fill="none" stroke={COR_AZULEJO} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#azulejo-boas-vindas)" />
    </svg>
  )
}

export default function BemVindoPainel({ nome }: { nome: string }) {
  const primeiroNome = nome.split(' ')[0] || nome

  return (
    <div className="relative flex min-h-[calc(100vh-113px)] flex-col items-center justify-center px-6" style={{ backgroundColor: COR_FUNDO }}>
      {/* Logo e menu de conta agora vêm do layout compartilhado
          ((dashboard)/layout.tsx) — aqui só sobra o conteúdo central. */}
      <div className="pointer-events-none absolute">
        <MotivoAzulejo />
      </div>

        <div className="relative max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: COR_TEXTO }}>
            Olá, {primeiroNome} 👋
          </h1>
          <p className="mt-3 text-base opacity-70" style={{ color: COR_TEXTO }}>
            Vamos colocar seu estabelecimento no ar — leva menos de 2 minutos.
          </p>

          <Link
            href="/estabelecimentos/novo"
            className="mt-8 inline-block rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:brightness-110"
            style={{ backgroundColor: COR_TERRACOTA }}
          >
            Adicionar meu estabelecimento
          </Link>

          <p className="mt-4 text-xs opacity-50" style={{ color: COR_TEXTO }}>
            Só pedimos o CNPJ pra confirmar que o negócio é seu — seus dados ficam protegidos.
          </p>
        </div>
    </div>
  )
}
