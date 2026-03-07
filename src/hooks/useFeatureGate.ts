'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PlanLimits {
    // Numeric limits
    max_products: number;
    max_categories: number;
    max_delivery_zones: number;
    max_monthly_orders: number;

    // Boolean feature flags
    allow_custom_slug: boolean;
    allow_variants: boolean;
    allow_excel_import: boolean;
    allow_social_links: boolean;
    allow_banner: boolean;
    allow_thermal_printing: boolean;
    free_delivery_all_zones: boolean;
    allow_category_images: boolean;
    allow_multiple_product_images: boolean;
    allow_about_page: boolean;
    allow_order_reception_options: boolean;
    custom_theme: boolean;
    remove_branding: boolean;
    advanced_reports: boolean;
    enable_ordering: boolean;

    // Meta
    plan_name: string;
    is_free: boolean;
}

const FREE_DEFAULTS: PlanLimits = {
    max_products: 45,
    max_categories: 3,
    max_delivery_zones: 1,
    max_monthly_orders: 20,
    allow_custom_slug: false,
    allow_variants: false,
    allow_excel_import: false,
    allow_social_links: false,
    allow_banner: false,
    allow_thermal_printing: false,
    free_delivery_all_zones: false,
    allow_category_images: false,
    allow_multiple_product_images: false,
    allow_about_page: false,
    allow_order_reception_options: false,
    custom_theme: true,
    remove_branding: false,
    advanced_reports: false,
    enable_ordering: true,
    plan_name: 'Free',
    is_free: true,
};

export function useFeatureGate(storeId: string | null) {
    const [plan, setPlan] = useState<PlanLimits>(FREE_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({
        products: 0,
        sections: 0,
        zones: 0,
        monthlyOrders: 0,
    });

    useEffect(() => {
        if (!storeId) return;

        const fetchPlanAndCounts = async () => {
            setLoading(true);
            try {
                // 1. Fetch store's subscription plan
                const { data: store } = await supabase
                    .from('stores')
                    .select(`
                        subscription_plans (
                            name_en,
                            max_products,
                            max_categories,
                            max_delivery_zones,
                            max_monthly_orders,
                            allow_custom_slug,
                            allow_variants,
                            allow_excel_import,
                            allow_social_links,
                            allow_banner,
                            allow_thermal_printing,
                            free_delivery_all_zones,
                            allow_category_images,
                            allow_multiple_product_images,
                            allow_about_page,
                            allow_order_reception_options,
                            custom_theme,
                            remove_branding,
                            advanced_reports,
                            enable_ordering
                        )
                    `)
                    .eq('id', storeId)
                    .single();

                const sp = (store as any)?.subscription_plans;
                if (sp) {
                    setPlan({
                        max_products: sp.max_products ?? FREE_DEFAULTS.max_products,
                        max_categories: sp.max_categories ?? FREE_DEFAULTS.max_categories,
                        max_delivery_zones: sp.max_delivery_zones ?? FREE_DEFAULTS.max_delivery_zones,
                        max_monthly_orders: sp.max_monthly_orders ?? FREE_DEFAULTS.max_monthly_orders,
                        allow_custom_slug: sp.allow_custom_slug ?? false,
                        allow_variants: sp.allow_variants ?? false,
                        allow_excel_import: sp.allow_excel_import ?? false,
                        allow_social_links: sp.allow_social_links ?? false,
                        allow_banner: sp.allow_banner ?? false,
                        allow_thermal_printing: sp.allow_thermal_printing ?? false,
                        free_delivery_all_zones: sp.free_delivery_all_zones ?? false,
                        allow_category_images: sp.allow_category_images ?? false,
                        allow_multiple_product_images: sp.allow_multiple_product_images ?? false,
                        allow_about_page: sp.allow_about_page ?? false,
                        allow_order_reception_options: sp.allow_order_reception_options ?? false,
                        custom_theme: sp.custom_theme ?? true,
                        remove_branding: sp.remove_branding ?? false,
                        advanced_reports: sp.advanced_reports ?? false,
                        enable_ordering: sp.enable_ordering ?? true,
                        plan_name: sp.name_en ?? 'Free',
                        is_free: (sp.name_en ?? 'Free') === 'Free',
                    });
                }

                // 2. Fetch current counts for limit enforcement
                const [productsRes, sectionsRes, zonesRes, ordersRes] = await Promise.all([
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    supabase.from('sections').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    supabase.from('delivery_zones').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
                    // Count orders this month
                    supabase.from('orders').select('*', { count: 'exact', head: true })
                        .eq('store_id', storeId)
                        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
                ]);

                setCounts({
                    products: productsRes.count ?? 0,
                    sections: sectionsRes.count ?? 0,
                    zones: zonesRes.count ?? 0,
                    monthlyOrders: ordersRes.count ?? 0,
                });
            } catch (err) {
                console.error('[FeatureGate] Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanAndCounts();
    }, [storeId]);

    // Convenience helpers
    const canAddProduct = () => counts.products < plan.max_products;
    const canAddSection = () => counts.sections < plan.max_categories;
    const canAddZone = () => counts.zones < plan.max_delivery_zones;
    const hasReachedOrderLimit = () => counts.monthlyOrders >= plan.max_monthly_orders;

    const remainingProducts = Math.max(0, plan.max_products - counts.products);
    const remainingSections = Math.max(0, plan.max_categories - counts.sections);
    const remainingOrders = Math.max(0, plan.max_monthly_orders - counts.monthlyOrders);

    return {
        plan,
        counts,
        loading,
        canAddProduct,
        canAddSection,
        canAddZone,
        hasReachedOrderLimit,
        remainingProducts,
        remainingSections,
        remainingOrders,
    };
}
