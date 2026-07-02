import Link from 'next/link'

export default function PublicHeader() {
  return (
    <>
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        🏪 É dono de um restaurante ou bar?{' '}
        <Link href="/estabelecimentos/novo" className="font-bold underline hover:text-yellow-200">
          Cadastre seu cardápio digital grátis
        </Link>
      </div>
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-lg font-black tracking-tight text-neutral-900">
            menu<span className="text-orange-600">.salvador</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link href="/" className="hidden hover:text-orange-600 sm:inline">
              Explorar
            </Link>
            <Link
              href="/estabelecimentos/novo"
              className="rounded-full bg-orange-600 px-4 py-2 text-white shadow-sm transition hover:bg-orange-700"
            >
              Cadastrar negócio
            </Link>
          </nav>
        </div>
      </header>
    </>
  )
}
