import Link from 'next/link'
import { User as UserIcon, LogOut } from 'lucide-react'

const COR_TEXTO = '#2A2420'

/**
 * <details>/<summary> em vez de useState: o navegador cuida de
 * abrir/fechar sozinho, sem depender de nenhum onClick sendo
 * registrado depois da hidratação — mais robusto contra qualquer
 * problema de timing entre servidor e cliente.
 */
export default function MenuAvatar({ onLogout }: { onLogout: (formData: FormData) => void | Promise<void> }) {
  return (
    <details className="group relative">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border transition hover:bg-black/5 marker:content-none [&::-webkit-details-marker]:hidden"
        style={{ borderColor: `${COR_TEXTO}20`, color: COR_TEXTO }}
        aria-label="Menu da conta"
      >
        <UserIcon className="h-4 w-4" />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-black/5 bg-white py-1 shadow-lg">
        <Link
          href="/painel/perfil"
          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"
          style={{ color: COR_TEXTO }}
        >
          <UserIcon className="h-3.5 w-3.5" />
          Meu perfil
        </Link>
        <form action={onLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-black/5"
            style={{ color: COR_TEXTO }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </form>
      </div>
    </details>
  )
}
