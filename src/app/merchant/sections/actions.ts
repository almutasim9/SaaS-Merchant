'use server';

import { createClient as createServerClient, supabaseAdmin } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// Helper to securely get the authenticated merchant's store ID
async function getSecureStoreId(supabase: any) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('غير مصرح لك بالقيام بهذا الإجراء.');

    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id)
        .single();

    if (storeError || !store) throw new Error('لم يتم العثور على متجرك.');
    return store.id;
}

export async function getSections(storeId: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching sections:', error);
        return [];
    }
    return data;
}

export async function addSection(storeId: string, name: string, imageUrl?: string, name_en?: string, name_ku?: string) {
    const supabase = await createServerClient();
    const secureStoreId = await getSecureStoreId(supabase);

    if (storeId !== secureStoreId) {
        throw new Error('غير مصرح لمتجرك بالقيام بهذا الإجراء.');
    }

    // Check for duplicate name in the same store
    const { data: existing } = await supabase
        .from('sections')
        .select('id')
        .eq('store_id', storeId)
        .ilike('name', name.trim())
        .maybeSingle();

    if (existing) {
        throw new Error('يوجد قسم بهذا الاسم بالفعل. يرجى اختيار اسم مختلف.');
    }

    const { data, error } = await supabase
        .from('sections')
        .insert({
            store_id: storeId,
            name: name.trim(),
            name_en: name_en?.trim() || null,
            name_ku: name_ku?.trim() || null,
            image_url: imageUrl
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/products');
    revalidatePath('/merchant/products/add');
    return data;
}

export async function updateSection(id: string, name: string, imageUrl?: string, name_en?: string, name_ku?: string) {
    const supabase = await createServerClient();
    const secureStoreId = await getSecureStoreId(supabase);

    const { data, error } = await supabase
        .from('sections')
        .update({
            name: name.trim(),
            name_en: name_en?.trim() || null,
            name_ku: name_ku?.trim() || null,
            image_url: imageUrl
        })
        .eq('id', id)
        .eq('store_id', secureStoreId) // Critical: Tenant Isolation
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/products');
    revalidatePath('/merchant/products/add');
    return data;
}

export async function deleteSection(sectionId: string) {
    const supabase = await createServerClient();
    const secureStoreId = await getSecureStoreId(supabase);

    const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId)
        .eq('store_id', secureStoreId); // Critical: Tenant Isolation

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/products');
    revalidatePath('/merchant/products/add');
    return { success: true };
}

export async function uploadSectionImageAction(storeId: string, base64Data: string, fileExt: string) {
    try {
        const supabase = await createServerClient();
        const secureStoreId = await getSecureStoreId(supabase);

        if (storeId !== secureStoreId) {
            throw new Error('غير مصرح لمتجرك بالقيام بهذا الإجراء.');
        }
        const fileName = `section-${storeId}-${Date.now()}.${fileExt}`;
        const filePath = `${storeId}/sections/${fileName}`;
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
        return { success: false, error: err.message || 'خطأ غير متوقع في رفع الصورة' };
    }
}
