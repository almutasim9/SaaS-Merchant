'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Input Validation Schemas
const OrderItemSchema = z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
    // Validate price if sent from client, but we MUST override it from DB anyway.
    // We include it here just to validate structure.
    price: z.number().nonnegative().optional(),
    name: z.string().optional(),
});

const CustomerInfoSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    phone: z.string().min(8, 'رقم الهاتف غير صحيح').max(20).regex(/^\+?[0-9\s-]+$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط'),
    address: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
});

const PlaceOrderSchema = z.object({
    storeId: z.string().uuid(),
    items: z.array(OrderItemSchema).min(1, 'السلة فارغة'),
    customerInfo: CustomerInfoSchema,
});

export async function placeOrderAction(orderData: any) {
    console.log('[SERVER] placeOrderAction started');

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // 1. Input Validation
        const result = PlaceOrderSchema.safeParse(orderData);

        if (!result.success) {
            const errorMessage = result.error.issues.map(e => e.message).join(', ');
            console.error('[SERVER] Validation Error:', errorMessage);
            return { success: false, error: errorMessage || 'بيانات الطلب غير صحيحة.' };
        }

        const { storeId, customerInfo, items } = result.data;

        // 2. Fetch Products for Verification
        const productIds = items.map(item => item.id);

        const { data: dbProducts, error: fetchError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, stock_quantity')
            .in('id', productIds);

        if (fetchError || !dbProducts) {
            console.error('[SERVER] Product fetch error:', fetchError);
            throw new Error('فشل التحقق من المنتجات في قاعدة البيانات.');
        }

        // 3. Logic & Price Calculation
        let serverTotalPrice = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) throw new Error(`المنتج ذو المعرف ${item.id} غير متوفر.`);

            // Stock Check
            if (product.stock_quantity !== null && product.stock_quantity <= 0) {
                throw new Error(`المنتج ${product.name} نفذ من المخزن.`);
            }

            const unitPrice = Number(product.price);
            serverTotalPrice += unitPrice * item.quantity;

            validatedItems.push({
                id: item.id,
                quantity: item.quantity,
                name: product.name,
                price: unitPrice // Always use server price
            });
        }

        // 4. Create Order
        const { data: newOrder, error: insertError } = await supabaseAdmin
            .from('orders')
            .insert({
                store_id: storeId,
                customer_info: customerInfo, // Trusted z.parsed data
                items: validatedItems,
                total_price: serverTotalPrice,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('[SERVER] Insert error:', insertError);
            throw new Error('فشل إنشاء الطلب في قاعدة البيانات.');
        }

        return { success: true, orderId: newOrder.id };

    } catch (error: any) {
        console.error('[SERVER] Order error:', error);
        return { success: false, error: error.message || 'حدث خطأ غير متوقع.' };
    }
}
