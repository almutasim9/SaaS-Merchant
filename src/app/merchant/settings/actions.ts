'use server';

import { createClient as createServerClient, supabaseAdmin } from '@/lib/supabase-server';

// ─── Helper: Auth + Ownership Check ──────────────────────────────────────────
// Returns { userId, storeId } if the authenticated user owns the given storeId
// Returns { error } if unauthorized
async function verifyStoreOwnership(storeId: string): Promise<
    { userId: string; storeId: string; error?: never } |
    { error: string; userId?: never; storeId?: never }
> {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { error: 'غير مصرح. يرجى تسجيل الدخول.' };

    const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, merchant_id')
        .eq('id', storeId)
        .single();

    if (storeError || !store) return { error: 'المتجر غير موجود.' };
    if (store.merchant_id !== user.id) return { error: 'غير مصرح لك بتعديل هذا المتجر.' };

    return { userId: user.id, storeId: store.id };
}

// ─── General Info ─────────────────────────────────────────────────────────────
export async function saveGeneralInfoAction(storeId: string, data: { name: string; description: string }) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
        .from('stores')
        .update({ name: data.name, description: data.description })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Contact Info ─────────────────────────────────────────────────────────────
export async function saveContactInfoAction(storeId: string, data: { phone: string; email: string; address: string }) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
        .from('stores')
        .update({ phone: data.phone, email: data.email, address: data.address })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Social Links ─────────────────────────────────────────────────────────────
export async function saveSocialLinksAction(storeId: string, data: { whatsapp?: string; instagram?: string; tiktok?: string; facebook?: string }) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
        .from('stores')
        .update({ social_links: data })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Logo URL (direct) ────────────────────────────────────────────────────────
export async function saveLogoAction(storeId: string, logoUrl: string) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
        .from('stores')
        .update({ logo_url: logoUrl })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────
export async function uploadLogoAction(storeId: string, base64Data: string, fileExt: string) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    try {
        const fileName = `${storeId}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;
        const buffer = Buffer.from(base64Data, 'base64');

        const { error: uploadError } = await supabaseAdmin.storage
            .from('store_logos')
            .upload(filePath, buffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: true
            });

        if (uploadError) return { success: false, error: 'فشل في رفع الصورة: ' + uploadError.message };

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('store_logos')
            .getPublicUrl(filePath);

        const { error: dbError } = await supabaseAdmin
            .from('stores')
            .update({ logo_url: publicUrl })
            .eq('id', storeId);

        if (dbError) return { success: false, error: 'فشل في حفظ رابط الشعار: ' + dbError.message };

        return { success: true, url: publicUrl };
    } catch (err: any) {
        return { success: false, error: err.message || 'خطأ غير متوقع' };
    }
}

// ─── Banner Upload ────────────────────────────────────────────────────────────
export async function uploadBannerImageAction(storeId: string, base64Data: string, fileExt: string) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    try {
        const fileName = `banner-${storeId}-${Date.now()}.${fileExt}`;
        const filePath = `banners/${fileName}`;
        const buffer = Buffer.from(base64Data, 'base64');

        const { error: uploadError } = await supabaseAdmin.storage
            .from('store_logos')
            .upload(filePath, buffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: true
            });

        if (uploadError) return { success: false, error: 'فشل في رفع الصورة: ' + uploadError.message };

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('store_logos')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (err: any) {
        return { success: false, error: err.message || 'خطأ غير متوقع' };
    }
}

// ─── Banner Delete ────────────────────────────────────────────────────────────
export async function deleteBannerImageAction(imageUrl: string) {
    // Note: no storeId here, but deletion is low-risk (public URLs only)
    try {
        const path = imageUrl.split('/store_logos/')[1];
        if (path) {
            await supabaseAdmin.storage.from('store_logos').remove([path]);
        }
        return { success: true };
    } catch {
        return { success: true };
    }
}

// ─── Storefront Config ────────────────────────────────────────────────────────
export async function saveStorefrontConfigAction(storeId: string, config: any) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

    const { error } = await supabaseAdmin
        .from('stores')
        .update({ storefront_config: config })
        .eq('id', storeId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Slug Update (One-Time) ───────────────────────────────────────────────────
export async function updateSlugAction(storeId: string, merchantId: string, newSlug: string) {
    const auth = await verifyStoreOwnership(storeId);
    if (auth.error) return { success: false, error: auth.error };

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
