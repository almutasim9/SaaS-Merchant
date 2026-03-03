'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/order-statuses';

/** Valid state transitions — key = current status, value = allowed next statuses */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'pending', 'cancelled'],
    shipped: ['completed', 'returned', 'processing'],
    // completed, returned, cancelled are final states — no transitions allowed
};

export async function updateOrderStatusAction(orderId: string, newStatus: string, cancellationReason?: string) {
    const supabase = await createServerClient();

    // 1. Validate status
    const validStatuses = Object.values(ORDER_STATUSES);
    if (!validStatuses.includes(newStatus as OrderStatus)) {
        return { success: false, error: 'حالة الطلب غير صالحة.' };
    }

    // 2. Auth + Data in parallel (3 queries → 1 round trip)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'غير مصرح.' };
    }

    const [storeResult, orderResult] = await Promise.all([
        supabase.from('stores').select('id').eq('merchant_id', user.id).single(),
        supabase.from('orders').select('id, store_id, status').eq('id', orderId).single()
    ]);

    const store = storeResult.data;
    const order = orderResult.data;

    if (!store) {
        return { success: false, error: 'لم يتم العثور على متجرك.' };
    }

    if (!order || order.store_id !== store.id) {
        return { success: false, error: 'هذا الطلب لا يخص متجرك.' };
    }

    // 2b. Validate state transition
    const currentStatus = (order as any).status as string;
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
        return { success: false, error: `لا يمكن نقل الطلب من "${currentStatus}" إلى "${newStatus}".` };
    }

    // 3. Build update payload
    const updatePayload: Record<string, any> = { status: newStatus };
    if (cancellationReason) {
        updatePayload.cancellation_reason = cancellationReason;
    }

    // 4. Update
    const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

    if (updateError) {
        return { success: false, error: 'فشل تحديث الحالة.' };
    }

    return { success: true };
}
