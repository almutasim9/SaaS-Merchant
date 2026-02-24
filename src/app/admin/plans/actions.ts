'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export interface SubscriptionPlan {
    id: string;
    name_ar: string;
    name_en: string;
    price_monthly: number;
    price_yearly: number;
    max_products: number;
    max_categories: number;
    max_delivery_zones: number;
    free_delivery_all_zones: boolean;
    allow_custom_slug: boolean;
    max_monthly_orders: number;
    custom_theme: boolean;
    remove_branding: boolean;
    advanced_reports: boolean;
    features_ar: string[];
    features_en: string[];
    features_ku: string[];
}

export async function fetchPlansAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .order('max_products', { ascending: true });

        if (error) {
            console.error('Error fetching plans:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as SubscriptionPlan[] };
    } catch (err: any) {
        return { success: false, error: err.message || 'خطأ غير متوقع في جلب الباقات' };
    }
}

export async function updatePlanAction(planId: string, updates: Partial<SubscriptionPlan>) {
    try {
        const { error } = await supabaseAdmin
            .from('subscription_plans')
            .update(updates)
            .eq('id', planId);

        if (error) {
            console.error('Error updating plan:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'خطأ غير متوقع في تحديث الباقة' };
    }
}
