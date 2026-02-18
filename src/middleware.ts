import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Protected Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check for Admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 2. Protected Merchant Routes
    if (request.nextUrl.pathname.startsWith('/merchant')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check for Merchant role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'merchant') {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 3. Redirect logged-in users away from /login
    if (request.nextUrl.pathname === '/login' && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'super_admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else if (profile?.role === 'merchant') {
            return NextResponse.redirect(new URL('/merchant/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/merchant/:path*', '/login'],
}
