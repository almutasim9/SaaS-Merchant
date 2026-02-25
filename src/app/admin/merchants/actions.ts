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
            plan_started_at,
            plan_expires_at,
            subscription_plans (name_en),
            profiles (full_name, phone_number)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ADMIN] Error fetching stores:', error);
        return [];
    }

    const mappedData = (data || []).map((bStore: any) => ({
        ...bStore,
        subscription_type: bStore.subscription_plans?.name_en || 'Free',
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

    // Look up the correct plan_id based on subscriptionType (Free, Pro, Premium)
    let actualPlanId = planId;
    if (subscriptionType) {
        const { data: planData } = await supabaseAdmin
            .from('subscription_plans')
            .select('id')
            .eq('name_en', subscriptionType)
            .single();
        if (planData?.id) {
            actualPlanId = planData.id;
        }
    }

    const { error } = await supabaseAdmin
        .from('stores')
        .update({
            plan_id: actualPlanId,
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
