'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

// --- Per-Section Save Actions (using admin client to bypass RLS) ---

export async function saveGeneralInfoAction(storeId: string, data: { name: string; description: string }) {
    const { error } = await supabaseAdmin
        .from('stores')
        .update({ name: data.name, description: data.description })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function saveContactInfoAction(storeId: string, data: { phone: string; email: string; address: string }) {
    const { error } = await supabaseAdmin
        .from('stores')
        .update({ phone: data.phone, email: data.email, address: data.address })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function saveSocialLinksAction(storeId: string, data: { whatsapp?: string; instagram?: string; tiktok?: string; facebook?: string }) {
    const { error } = await supabaseAdmin
        .from('stores')
        .update({ social_links: data })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function saveLogoAction(storeId: string, logoUrl: string) {
    const { error } = await supabaseAdmin
        .from('stores')
        .update({ logo_url: logoUrl })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// --- Slug Update (One-Time) ---

export async function updateSlugAction(storeId: string, merchantId: string, newSlug: string) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug) || newSlug.length < 3 || newSlug.length > 50) {
        return { success: false, error: 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-50 حرف).' };
    }

    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, slug, slug_changed, merchant_id')
        .eq('id', storeId)
        .single();

    if (storeError || !store) return { success: false, error: 'المتجر غير موجود.' };
    if (store.merchant_id !== merchantId) return { success: false, error: 'غير مصرح لك بتعديل هذا المتجر.' };
    if (store.slug_changed) return { success: false, error: 'لقد قمت بتغيير الرابط مسبقاً. يمكنك تغييره مرة واحدة فقط.' };
    if (store.slug === newSlug) return { success: false, error: 'الرابط الجديد مطابق للرابط الحالي.' };

    const { data: existing } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', storeId)
        .single();

    if (existing) return { success: false, error: 'هذا الرابط مستخدم بالفعل من متجر آخر. اختر رابطاً مختلفاً.' };

    const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({ slug: newSlug, slug_changed: true })
        .eq('id', storeId);

    if (updateError) return { success: false, error: 'حدث خطأ أثناء تحديث الرابط: ' + updateError.message };
    return { success: true };
}
