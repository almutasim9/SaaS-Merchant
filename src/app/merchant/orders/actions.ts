'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
    const supabase = await createServerClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'غير مصرح.' };
    }

    // 2. Get the merchant's store
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id)
        .single();

    if (!store) {
        return { success: false, error: 'لم يتم العثور على متجرك.' };
    }

    // 3. Verify the order belongs to this merchant's store
    const { data: order } = await supabase
        .from('orders')
        .select('id, store_id')
        .eq('id', orderId)
        .single();

    if (!order || order.store_id !== store.id) {
        return { success: false, error: 'هذا الطلب لا يخص متجرك.' };
    }

    // 4. Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'postponed', 'returned', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        return { success: false, error: 'حالة الطلب غير صالحة.' };
    }

    // 5. Update
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (updateError) {
        return { success: false, error: 'فشل تحديث الحالة.' };
    }

    return { success: true };
}
