'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id)
        .single();

    if (!store) throw new Error('Store not found');

    const { data, error } = await supabase
        .from('merchant_notifications')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data;
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('merchant_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
    revalidatePath('/merchant');
    return { success: true };
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id)
        .single();

    if (!store) return;

    const { error } = await supabase
        .from('merchant_notifications')
        .update({ is_read: true })
        .eq('store_id', store.id)
        .eq('is_read', false);

    if (error) throw error;
    revalidatePath('/merchant');
    return { success: true };
}
