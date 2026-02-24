'use server';

import { supabaseAdmin } from '@/lib/supabase-server';

export interface PublicSubscriptionPlan {
    id: string;
    name_ar: string;
    name_en: string;
    name_ku?: string;
    description_ar?: string;
    description_en?: string;
    description_ku?: string;
    yearly_discount_percent?: number;
    price_monthly: number;
    price_yearly: number;
    features_ar: string[];
    features_en: string[];
    features_ku: string[];
    max_products: number;
    max_monthly_orders: number;
    max_delivery_zones: number;
    custom_theme: boolean;
    remove_branding: boolean;
    allow_custom_slug: boolean;
    free_delivery_all_zones: boolean;
    advanced_reports: boolean;
}

export async function getPublicSubscriptionPlans() {
    try {
        const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) {
            console.error('Error fetching public subscription plans:', error);
            return { success: false, error: 'Database error' };
        }

        return { success: true, data: data as PublicSubscriptionPlan[] };
    } catch (error) {
        console.error('Server action error:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
