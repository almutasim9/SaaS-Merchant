'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

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

export async function addSection(storeId: string, name: string, imageUrl?: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('sections')
        .insert({ store_id: storeId, name, image_url: imageUrl })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/sections');
    revalidatePath('/merchant/products/add');
    return data;
}

export async function updateSection(id: string, name: string, imageUrl?: string) {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('sections')
        .update({ name, image_url: imageUrl })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/sections');
    revalidatePath('/merchant/products/add');
    return data;
}

export async function deleteSection(sectionId: string) {
    const supabase = await createServerClient();
    const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/merchant/sections');
    revalidatePath('/merchant/products/add');
    return { success: true };
}
