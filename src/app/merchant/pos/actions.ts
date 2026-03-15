'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';
import { adjustProductStock } from '@/lib/inventory-utils';

export async function createPOSOrderAction(items: any[], totalPrice: number) {
    const supabase = await createServerClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'غير مصرح.' };
    }

    // 2. Get store details
    const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id)
        .single();
    
    if (!storeData) {
        return { success: false, error: 'المتجر غير موجود.' };
    }

    // 3. Create order
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            store_id: storeData.id,
            customer_info: { 
                name: 'زبون محلي (POS)', 
                phone: '-', 
                city: 'تم البيع من الكاشير',
                notes: items.length > 0 ? `البيع المباشر - الكاشير` : '' 
            },
            items: items,
            total_price: totalPrice,
            delivery_fee: 0,
            status: 'completed',
            order_type: 'pickup',
            governorate: 'داخل المحل'
        })
        .select()
        .single();

    if (orderError) {
        return { success: false, error: 'فشل إنشاء الطلب.' };
    }

    // 4. Update inventory
    for (const item of items) {
        await adjustProductStock(supabase, item.id, -item.quantity, item.selections);
    }

    return { success: true, orderId: orderData.id };
}

export async function refundPOSOrderAction(orderId: string) {
    const supabase = await createServerClient();

    try {
        // 1. Get order details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('items, status')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) throw new Error('الطلب غير موجود.');
        if (order.status === 'cancelled') throw new Error('الطلب ملغى بالفعل.');

        // 2. Increment stock for each item
        const items = order.items as any[];
        for (const item of items) {
             await adjustProductStock(supabase, item.id, item.quantity, item.selections);
        }

        // 3. Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function partialRefundPOSOrderAction(orderId: string, itemsToRefund: { id: string, quantity: number, selections?: any }[]) {
    const supabase = await createServerClient();

    try {
        // 1. Get order details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('items, total_price, status')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) throw new Error('الطلب غير موجود.');
        if (order.status === 'cancelled') throw new Error('الطلب ملغى بالفعل.');

        const orderItems = [...(order.items as any[])];
        let priceToDeduct = 0;

        // 2. Process each item to refund
        for (const refundItem of itemsToRefund) {
            // Find the item in the order
            const idx = orderItems.findIndex(oi => 
                oi.id === refundItem.id && 
                JSON.stringify(oi.selections || {}) === JSON.stringify(refundItem.selections || {})
            );

            if (idx === -1) continue;

            const originalItem = orderItems[idx];
            const returnQty = Math.min(refundItem.quantity, originalItem.quantity);
            
            if (returnQty <= 0) continue;

            // Update local orderItems list
            if (returnQty === originalItem.quantity) {
                // Fully refund this item line
                originalItem.is_refunded = true;
                originalItem.refunded_quantity = returnQty;
            } else {
                // Partially refund this item line
                originalItem.quantity -= returnQty;
                originalItem.refunded_quantity = (originalItem.refunded_quantity || 0) + returnQty;
            }

            priceToDeduct += (originalItem.price * returnQty);

            // Restore Stock
            await adjustProductStock(supabase, originalItem.id, returnQty, originalItem.selections);
        }

        // 3. Update the order
        const newTotalPrice = Math.max(0, order.total_price - priceToDeduct);
        const allRefunded = orderItems.every(oi => oi.quantity === 0 || oi.is_refunded);

        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                items: orderItems,
                total_price: newTotalPrice,
                status: allRefunded ? 'cancelled' : order.status
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
