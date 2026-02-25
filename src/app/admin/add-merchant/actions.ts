'use server';

import { createClient as createServerClient, supabaseAdmin } from '@/lib/supabase-server';
import { z } from 'zod';

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

const RegisterMerchantSchema = z.object({
    storeName: z.string().min(2, 'اسم المتجر مطلوب').max(100),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'),
    category: z.string().min(1, 'يرجى اختيار التصنيف'),
    subscriptionType: z.enum(['Free', 'Pro', 'Premium']).default('Free'),
    subscriptionDuration: z.enum(['3', '6', '12']).default('12'),
    planStartDate: z.string().min(1, 'تاريخ بداية الاشتراك مطلوب'),
    ownerName: z.string().min(2, 'اسم المالك مطلوب'),
    phone: z.string().min(9, 'رقم الهاتف غير صحيح'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

// Helper: add N months to a date string and return ISO string
function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
}

export async function registerMerchantAction(formData: any) {
    // 0. Server-side Authorization Check
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
        return { success: false, error: 'غير مصرح لك بالقيام بهذا الإجراء.' };
    }

    // 0b. Input Validation
    const validation = RegisterMerchantSchema.safeParse(formData);
    if (!validation.success) {
        const errorMessage = validation.error.issues.map((e: any) => e.message).join(', ');
        return { success: false, error: errorMessage };
    }
    const validData = validation.data;

    // Compute expiry date
    const durationMonths = parseInt(validData.subscriptionDuration);
    const planStartedAt = new Date(validData.planStartDate).toISOString();
    const planExpiresAt = addMonths(validData.planStartDate, durationMonths);

    let userId: string | null = null;

    try {
        // 1. Create User via Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: { full_name: formData.ownerName }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('فشل إنشاء الحساب في نظام الهوية.');

        userId = authData.user.id;

        // 2. Insert into Profiles
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role: 'merchant',
                full_name: validData.ownerName,
                phone_number: validData.phone,
            });

        if (profileError) throw profileError;

        // 3. Insert into Stores with subscription dates
        const { error: storeError } = await supabaseAdmin
            .from('stores')
            .insert({
                name: validData.storeName,
                slug: validData.slug,
                category: validData.category,
                subscription_type: validData.subscriptionType,
                merchant_id: userId,
                is_active: true,
                plan_started_at: planStartedAt,
                plan_expires_at: planExpiresAt,
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

        // ROLLBACK: delete user if store creation failed
        if (userId) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        return {
            success: false,
            error: error.message || 'حدث خطأ غير متوقع أثناء التسجيل.'
        };
    }
}
