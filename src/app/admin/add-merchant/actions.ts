'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Helper to verify admin session
async function verifyAdminSession() {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'super_admin';
}

export async function registerMerchantAction(formData: any) {
    // 0. Server-side Authorization Check
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
        return { success: false, error: 'غير مصرح لك بالقيام بهذا الإجراء.' };
    }

    let userId: string | null = null;

    try {
        // 1. Create User via Admin API (Atomic Step 1)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { full_name: formData.ownerName }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('فشل إنشاء الحساب في نظام الهوية.');

        userId = authData.user.id;

        // 2. Insert into Profiles (Atomic Step 2)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role: 'merchant',
                full_name: formData.ownerName,
                phone_number: formData.phone,
            });

        if (profileError) throw profileError;

        // 3. Insert into Stores (Atomic Step 3)
        const { error: storeError } = await supabaseAdmin
            .from('stores')
            .insert({
                name: formData.storeName,
                slug: formData.slug,
                category: formData.category,
                subscription_type: formData.subscriptionType,
                merchant_id: userId,
                is_active: true
            });

        if (storeError) {
            if (storeError.code === '23505') {
                throw new Error('هذا الـ Slug مستخدم بالفعل، يرجى اختيار اسم متجر آخر.');
            }
            throw storeError;
        }

        return { success: true };

    } catch (error: any) {
        console.error('Registration Error:', error);

        // ROLLBACK: If any step failed after user creation, delete the user
        if (userId) {
            console.log('Rolling back: Deleting user ID', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        return {
            success: false,
            error: error.message || 'حدث خطأ غير متوقع أثناء التسجيل.'
        };
    }
}
