import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Store {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    currency_preference: string;
    merchant_id: string;
    subscription_plans?: {
        name_en: string;
    };
}

export function useStore() {
    return useQuery<Store>({
        queryKey: ['merchant-store'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('stores')
                .select(`
                    id, 
                    name, 
                    slug, 
                    logo_url, 
                    currency_preference, 
                    merchant_id,
                    subscription_plans (
                        name_en
                    )
                `)
                .eq('merchant_id', user.id)
                .single();

            if (error) throw error;
            return data as any as Store;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
    });
}
