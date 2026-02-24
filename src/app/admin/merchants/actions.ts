'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export async function getAdminStores() {
    const { data, error } = await supabaseAdmin
        .from('stores')
        .select(`
            id,
            name,
            slug,
            created_at,
            phone,
            merchant_id,
            plan_id,
            profiles (full_name, phone_number)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ADMIN] Error fetching stores:', error);
        return [];
    }

    // Deep merge to ensure serialization compatibility from Supabase class to plain JSON
    const mappedData = (data || []).map((bStore: any) => ({
        ...bStore,
        profiles: {
            full_name: bStore.profiles?.full_name,
            phone: bStore.profiles?.phone_number
        }
    }));

    return JSON.parse(JSON.stringify(mappedData));
}

export async function updateStorePlanAction(storeId: string, planId: string) {
    const { error } = await supabaseAdmin
        .from('stores')
        .update({ plan_id: planId })
        .eq('id', storeId);

    if (error) {
        console.error('[ADMIN] Error updating plan:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}
