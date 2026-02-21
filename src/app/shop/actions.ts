'use server';

import { supabaseAdmin } from '@/lib/supabase-server';
import { z } from 'zod';

// Input Validation Schemas
const OrderItemSchema = z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
    // Validate price if sent from client, but we MUST override it from DB anyway.
    // We include it here just to validate structure.
    price: z.number().nonnegative().optional(),
    name: z.string().optional(),
    selections: z.record(z.string(), z.string()).optional(),
});

const CustomerInfoSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    phone: z.string().min(8, 'رقم الهاتف غير صحيح').max(20).regex(/^\+?[0-9\s-]+$/, 'رقم الهاتف يجب أن يحتوي على أرقام فقط'),
    city: z.string().min(2, 'الرجاء اختيار المحافظة'),
    landmark: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
});

const PlaceOrderSchema = z.object({
    storeId: z.string().uuid(),
    items: z.array(OrderItemSchema).min(1, 'السلة فارغة'),
    customerInfo: CustomerInfoSchema,
});

type OrderData = z.infer<typeof PlaceOrderSchema>;

export async function placeOrderAction(orderData: OrderData) {

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

        // 2b. Fetch Store Delivery Fees
        const { data: store, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('delivery_fees')
            .eq('id', storeId)
            .single();

        if (storeError) {
            console.error('[SERVER] Store fetch error:', storeError);
        }

        const IRAQ_CITIES = ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'السليمانية', 'دهوك', 'كركوك', 'النجف', 'كربلاء', 'الحلة', 'الأنبار', 'الديوانية', 'الكوت', 'العمارة', 'الناصرية', 'السماوة', 'ديالى', 'صلاح الدين'];
        const rawFees = store?.delivery_fees;

        let cityToFeeMap: Record<string, number> = {};

        if (rawFees && Array.isArray(rawFees.zones)) {
            rawFees.zones.forEach((zone: any) => {
                if (zone.enabled) {
                    zone.cities.forEach((city: string) => {
                        cityToFeeMap[city] = zone.fee;
                    });
                }
            });
        } else if (rawFees && typeof rawFees === 'object' && !('baghdad' in rawFees) && Object.keys(rawFees).length > 2) {
            Object.keys(rawFees).forEach(city => {
                if (rawFees[city].enabled) {
                    cityToFeeMap[city] = rawFees[city].fee;
                }
            });
        } else {
            const bFee = rawFees?.baghdad ?? 5000;
            const pFee = rawFees?.provinces ?? 8000;
            IRAQ_CITIES.forEach(city => {
                cityToFeeMap[city] = city === 'بغداد' ? bFee : pFee;
            });
        }

        const fee = cityToFeeMap[customerInfo.city];
        if (fee === undefined) {
            return { success: false, error: 'نعتذر، التوصيل غير متاح إلى هذه المحافظة حالياً.' };
        }

        // 3. Logic & Price Calculation
        let serverTotalPrice = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) throw new Error(`المنتج ذو المعرف ${item.id} غير متوفر.`);

            const unitPrice = Number(product.price);
            serverTotalPrice += unitPrice * item.quantity;

            validatedItems.push({
                id: item.id,
                quantity: item.quantity,
                name: product.name, // Always use server name
                price: unitPrice, // Always use server price
                selections: item.selections || {}
            });
        }

        // Add the delivery fee to the total sum
        serverTotalPrice += fee;

        // 4. Create Order
        const { data: newOrder, error: insertError } = await supabaseAdmin
            .from('orders')
            .insert({
                store_id: storeId,
                customer_info: customerInfo, // Trusted z.parsed data
                items: validatedItems,
                total_price: serverTotalPrice,
                delivery_fee: fee,
                governorate: customerInfo.city,
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
