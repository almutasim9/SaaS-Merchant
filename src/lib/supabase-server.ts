import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function createClient() {
    let cookieStore: Awaited<ReturnType<typeof cookies>> | undefined;
    try {
        cookieStore = await cookies();
    } catch {
        // Fallback for static generation (build-time) contexts 
        // where cookies() is not available.
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore?.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    if (!cookieStore) return;
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    if (!cookieStore) return;
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // The `remove` method was called from a Server Component.
                    }
                },
            },
        }
    );
}
