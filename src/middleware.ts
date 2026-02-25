import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Single auth call — validates JWT cryptographically (no DB round trip)
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ── 1. Admin Routes ────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        // Try JWT custom claim first (fast path — zero DB call after you add the hook)
        const jwtRole = user.user_metadata?.user_role as string | undefined

        if (jwtRole) {
            if (jwtRole !== 'super_admin') {
                return NextResponse.redirect(new URL('/login', request.url))
            }
        } else {
            // Fallback: DB query (until JWT hook is configured in Supabase dashboard)
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            if (profile?.role !== 'super_admin') {
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }

        // Pass role/uid to pages via headers (avoids re-fetching)
        response.headers.set('x-user-id', user.id)
        response.headers.set('x-user-role', jwtRole ?? 'super_admin')
    }

    // ── 2. Merchant Routes ─────────────────────────────────────────────────────
    if (pathname.startsWith('/merchant')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const jwtRole = user.user_metadata?.user_role as string | undefined

        if (jwtRole) {
            if (jwtRole !== 'merchant') {
                return NextResponse.redirect(new URL('/login', request.url))
            }
        } else {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            if (profile?.role !== 'merchant') {
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }

        response.headers.set('x-user-id', user.id)
        response.headers.set('x-user-role', jwtRole ?? 'merchant')
    }

    // ── 3. Redirect logged-in users away from /login ───────────────────────────
    if (pathname === '/login' && user) {
        const jwtRole = user.user_metadata?.user_role as string | undefined

        let role = jwtRole
        if (!role) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            role = profile?.role
        }

        if (role === 'super_admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        if (role === 'merchant') return NextResponse.redirect(new URL('/merchant/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/merchant/:path*', '/login'],
}
