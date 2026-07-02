import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Prefixos que exigem o usuário autenticado.
// Tudo que não começar com um destes prefixos é considerado público
// (home, cidade, bairro, tipo, estabelecimento, cardápio, culinária, menu, claim, etc.
// As páginas de "claim" e "estabelecimentos/novo" fazem sua própria checagem de sessão).
const PROTECTED_PREFIXES = ['/painel']
const ADMIN_PREFIXES = ['/admin']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix))

  // Rotas públicas: tudo que não seja painel/admin passa direto.
  if (!isProtectedRoute && !isAdminRoute) {
    return response
  }

  // Rotas protegidas (painel do lojista, área administrativa)
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Rotas administrativas (apenas super_admin)
  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
