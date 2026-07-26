import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-neutral-800 bg-neutral-900 py-12 text-neutral-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-xl font-black text-white">
              menu<span style={{ color: 'var(--brand-primary)' }}>.salvador</span>
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              O diretório de cardápios digitais de Salvador. Descubra onde comer, veja o cardápio
              e chegue até o balcão sem baixar nada.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Para donos de negócio
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/estabelecimentos/novo" className="hover:text-[var(--brand-primary)]">
                  Cadastrar estabelecimento
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--brand-primary)]">
                  Entrar no painel
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Sobre
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="text-neutral-400">© {new Date().getFullYear()} menu.salvador</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
