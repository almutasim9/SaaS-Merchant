'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export async function checkEmailExists(email: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email_placeholder', email) // Using placeholder or generic way to check profiles
            .single();

        // Actually, checking Supabase Auth is more reliable
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        const exists = userData.users.some(u => u.email === email);

        return { exists };
    } catch (error) {
        console.error('Error checking email:', error);
        return { exists: false };
    }
}

export async function checkSlugExists(slug: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('slug', slug)
            .single();

        return { exists: !!data };
    } catch (error) {
        console.error('Error checking slug:', error);
        return { exists: false };
    }
}
