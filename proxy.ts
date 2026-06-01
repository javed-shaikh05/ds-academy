import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, don't crash — just let the request through.
  // (Protected pages do their own auth check server-side anyway.)
  if (!url || !key) {
    console.error('Middleware: Supabase env vars missing — skipping auth check')
    return response
  }

  try {
    let res = NextResponse.next({ request })

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          res = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isAuthPage = path.startsWith('/login')

    // Not logged in + protected page → login
    if (!user && !isAuthPage && path !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logged in + on login page → dashboard
    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return res
  } catch (err) {
    // ANY failure in auth → let the request through instead of crashing.
    // Server components still guard themselves with their own getUser() checks.
    console.error('Middleware auth error (passing through):', err)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-).*)'],
}