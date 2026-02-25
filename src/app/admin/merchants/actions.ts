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
            subscription_type,
            plan_started_at,
            plan_expires_at,
            profiles (full_name, phone_number)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ADMIN] Error fetching stores:', error);
        return [];
    }

    const mappedData = (data || []).map((bStore: any) => ({
        ...bStore,
        profiles: {
            full_name: bStore.profiles?.full_name,
            phone: bStore.profiles?.phone_number
        }
    }));

    return JSON.parse(JSON.stringify(mappedData));
}

// Helper: add N months to a date string
function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
}

export async function updateStorePlanAction(
    storeId: string,
    planId: string,
    subscriptionType: string,
    startDate: string,
    durationMonths: number
) {
    const planStartedAt = new Date(startDate).toISOString();
    const planExpiresAt = addMonths(startDate, durationMonths);

    const { error } = await supabaseAdmin
        .from('stores')
        .update({
            plan_id: planId,
            subscription_type: subscriptionType,
            plan_started_at: planStartedAt,
            plan_expires_at: planExpiresAt,
        })
        .eq('id', storeId);

    if (error) {
        console.error('[ADMIN] Error updating plan:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}
