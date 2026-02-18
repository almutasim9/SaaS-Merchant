'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-server';

const RegistrationSchema = z.object({
    storeName: z.string().min(3, 'اسم المتجر يجب أن يكون 3 أحرف على الأقل').max(50),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط'),
    category: z.string().min(1, 'يرجى اختيار التصنيف'),
    subscriptionType: z.enum(['Free', 'Pro', 'Premium']).default('Free'),
    ownerName: z.string().min(2, 'اسم المالك مطلوب'),
    phone: z.string().min(9, 'رقم الهاتف غير صحيح'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export async function publicRegisterMerchantAction(formData: any) {
    let userId: string | null = null;

    try {
        // 1. Validation
        const result = RegistrationSchema.safeParse(formData);
        if (!result.success) {
            const errorMessage = result.error.issues.map(e => e.message).join(', ');
            return { success: false, error: errorMessage };
        }

        const data = result.data;

        // 2. Check if Slug Exists
        const { data: existingStore } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('slug', data.slug)
            .single();

        if (existingStore) {
            return { success: false, error: 'رابط المتجر (Slug) مستخدم بالفعل، يرجى اختيار اسم آخر.' };
        }

        // 3. Create User via Admin API (Atomic Step 1)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: { full_name: data.ownerName }
        });

        if (authError) {
            if (authError.message?.includes('already registered') || authError.status === 422) {
                return { success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً.' };
            }
            throw authError;
        }

        if (!authData.user) throw new Error('فشل إنشاء الحساب في نظام الهوية.');

        userId = authData.user.id;

        // 4. Insert into Profiles (Atomic Step 2)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role: 'merchant',
                full_name: data.ownerName,
                phone_number: data.phone,
            });

        if (profileError) throw profileError;

        // 5. Insert into Stores (Atomic Step 3)
        const { error: storeError } = await supabaseAdmin
            .from('stores')
            .insert({
                name: data.storeName,
                slug: data.slug,
                category: data.category,
                subscription_type: data.subscriptionType,
                merchant_id: userId,
                is_active: true
            });

        if (storeError) {
            throw storeError;
        }

        return { success: true };

    } catch (error: any) {
        console.error('[Public Register] Error:', error);

        // ROLLBACK: If any step failed after user creation, delete the user to maintain consistency
        if (userId) {
            console.log('[Public Register] Rolling back: Deleting user ID', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        return {
            success: false,
            error: error.message || 'حدث خطأ غير متوقع أثناء التسجيل.'
        };
    }
}
