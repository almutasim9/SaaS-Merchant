'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export async function getStoreSubscriptionAction(storeId: string) {
    try {
        const { data: storeData, error: storeError } = await supabaseAdmin
            .from('stores')
            .select(`
                plan_id,
                plan_expires_at,
                plan_started_at,
                subscription_plans (
                    id, name_en, name_ar, price_monthly, max_products, max_categories, custom_theme, remove_branding, advanced_reports
                )
            `)
            .eq('id', storeId)
            .single();

        if (storeError) throw storeError;

        // Fetch all available plans for upgrade prompts
        const { data: allPlans, error: plansError } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .order('max_products', { ascending: true });

        if (plansError) throw plansError;

        return {
            success: true,
            currentPlan: storeData.subscription_plans as any,
            planExpiresAt: storeData.plan_expires_at,
            planStartedAt: storeData.plan_started_at,
            subscriptionType: (storeData.subscription_plans as any)?.name_en || 'Free',
            allPlans: allPlans as any[]
        };
    } catch (err: any) {
        return { success: false, error: err.message || 'فشل في جلب بيانات الباقة' };
    }
}
