'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export async function updateSlugAction(storeId: string, merchantId: string, newSlug: string) {
    // 1. Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug) || newSlug.length < 3 || newSlug.length > 50) {
        return { success: false, error: 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-50 حرف).' };
    }

    // 2. Verify store ownership
    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, slug, slug_changed, merchant_id')
        .eq('id', storeId)
        .single();

    if (storeError || !store) {
        return { success: false, error: 'المتجر غير موجود.' };
    }

    if (store.merchant_id !== merchantId) {
        return { success: false, error: 'غير مصرح لك بتعديل هذا المتجر.' };
    }

    // 3. Check if slug was already changed
    if (store.slug_changed) {
        return { success: false, error: 'لقد قمت بتغيير الرابط مسبقاً. يمكنك تغييره مرة واحدة فقط.' };
    }

    // 4. Check if same as current
    if (store.slug === newSlug) {
        return { success: false, error: 'الرابط الجديد مطابق للرابط الحالي.' };
    }

    // 5. Check slug uniqueness
    const { data: existing } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', storeId)
        .single();

    if (existing) {
        return { success: false, error: 'هذا الرابط مستخدم بالفعل من متجر آخر. اختر رابطاً مختلفاً.' };
    }

    // 6. Update slug and mark as changed
    const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({ slug: newSlug, slug_changed: true })
        .eq('id', storeId);

    if (updateError) {
        return { success: false, error: 'حدث خطأ أثناء تحديث الرابط: ' + updateError.message };
    }

    return { success: true };
}
