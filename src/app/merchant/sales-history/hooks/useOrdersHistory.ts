'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Order {
    id: string;
    store_id: string;
    customer_info: {
        name: string;
        phone: string;
        address: string;
    };
    items: any[];
    total_price: number;
    delivery_fee?: number;
    status: string;
    created_at: string;
}

export function useOrdersHistory(storeId: string | null, timeRange: string = '1_month') {
    const queryClient = useQueryClient();

    const queryKey = ['orders-history', storeId, timeRange];

    const { data: orders = [], isLoading, error } = useQuery<Order[]>({
        queryKey,
        queryFn: async () => {
            if (!storeId) return [];

            let fromDate = new Date();
            if (timeRange === '1_week') fromDate.setDate(fromDate.getDate() - 7);
            else if (timeRange === '1_month') fromDate.setMonth(fromDate.getMonth() - 1);
            else if (timeRange === '2_months') fromDate.setMonth(fromDate.getMonth() - 2);
            else if (timeRange === '3_months') fromDate.setMonth(fromDate.getMonth() - 3);

            const { data, error } = await supabase
                .from('orders')
                .select('id, store_id, customer_info, items, total_price, delivery_fee, status, created_at')
                .eq('store_id', storeId)
                .in('status', ['completed', 'delivered', 'cancelled'])
                .gte('created_at', fromDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!storeId,
    });

    // Real-time subscription to invalidate cache
    useEffect(() => {
        if (!storeId) return;

        const subscription = supabase
            .channel('orders-history-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${storeId}`
            }, (payload) => {
                // Invalidate the query to fetch fresh data
                queryClient.invalidateQueries({ queryKey: ['orders-history', storeId] });
                
                if (payload.eventType === 'INSERT') {
                    toast.success('تحديث في الطلبات!', { 
                        description: 'تم تحديث مبيعاتك بناءً على تغييرات جديدة.' 
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [storeId, queryClient]);

    return { orders, isLoading, error };
}
