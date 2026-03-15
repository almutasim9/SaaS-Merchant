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
    city: z.string().optional(),
    landmark: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
    orderType: z.enum(['delivery', 'pickup']).optional().default('delivery'),
}).superRefine((data, ctx) => {
    if (data.orderType === 'delivery' && (!data.city || data.city.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'الرجاء اختيار المحافظة لتوصيل الطلب',
            path: ['city']
        });
    }
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

        // 1.5 Anti-Bot Rate Limiting (Max 3 orders per phone number per 15 minutes)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count: recentOrderCount, error: rateLimitError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            // Extract the phone from the JSONB customer_info column
            .or(`customer_info->>phone.eq.${customerInfo.phone},customer_info->>phone.eq.+${customerInfo.phone}`)
            .gte('created_at', fifteenMinsAgo);

        if (recentOrderCount !== null && recentOrderCount >= 3) {
            console.warn(`[SECURITY] Rate limit triggered for phone: ${customerInfo.phone} at store: ${storeId}`);
            return { success: false, error: 'لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار قليلاً أو التواصل مع المتجر.' };
        }

        // 2. Fetch Products for Verification
        const productIds = items.map(item => item.id);

        const { data: dbProducts, error: fetchError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, stock_quantity, attributes')
            .in('id', productIds);

        if (fetchError || !dbProducts) {
            console.error('[SERVER] Product fetch error:', fetchError);
            throw new Error('فشل التحقق من المنتجات في قاعدة البيانات.');
        }

        // 2b. Fetch Store Details & Delivery Fees
        const { data: store, error: storeError } = await supabaseAdmin
            .from('stores')
            .select(`
                is_active,
                accepts_orders,
                plan_expires_at,
                delivery_fees,
                subscription_plans!inner(
                    max_monthly_orders,
                    free_delivery_all_zones,
                    enable_ordering
                )
            `)
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            console.error('[SERVER] Store fetch error:', storeError);
            return { success: false, error: 'لم يتم العثور على المتجر.' };
        }

        // 2b-ii. Validate store is active and plan is not expired
        if (!store.is_active) {
            return { success: false, error: 'عذراً، هذا المتجر غير نشط حالياً.' };
        }
        if (store.accepts_orders === false) {
            return { success: false, error: 'عذراً، المتجر مغلق ولا يستقبل طلبات حالياً.' };
        }
        if ((store.subscription_plans as any)?.enable_ordering === false) {
            return { success: false, error: 'عذراً، خطة هذا المتجر لا تدعم استقبال الطلبات حالياً.' };
        }
        if (store.plan_expires_at && new Date(store.plan_expires_at) < new Date()) {
            return { success: false, error: 'عذراً، اشتراك هذا المتجر منتهي.' };
        }

        // 2c. Check Order Limits
        const maxOrders = (store?.subscription_plans as any)?.max_monthly_orders ?? 50;
        if (maxOrders !== -1) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabaseAdmin
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', storeId)
                .gte('created_at', startOfMonth.toISOString());

            if (!countError && count !== null && count >= maxOrders) {
                return { success: false, error: 'عذراً، المتجر غير قادر على استقبال طلبات جديدة حالياً.' };
            }
        }

        const rawFees = store?.delivery_fees as any;

        let cityToFeeMap: Record<string, number> = {};

        let fee = 0;

        if (customerInfo.orderType !== 'pickup') {
            if (rawFees && Array.isArray(rawFees.zones)) {
                // Modern format: zones[]
                rawFees.zones.forEach((zone: any) => {
                    if (zone.enabled) {
                        zone.cities.forEach((city: string) => {
                            cityToFeeMap[city] = zone.fee;
                        });
                    }
                });
            } else {
                // No delivery zones configured — reject delivery orders
                return { success: false, error: 'نعتذر، إعدادات التوصيل غير مكتملة لهذا المتجر.' };
            }

            fee = cityToFeeMap[customerInfo.city || ''];
            if (fee === undefined) {
                return { success: false, error: 'نعتذر، التوصيل غير متاح إلى هذه المحافظة حالياً.' };
            }

            // Apply Free Delivery if the store has it enabled globally AND the plan supports it
            if (rawFees?.isFreeDelivery && (store?.subscription_plans as any)?.free_delivery_all_zones) {
                fee = 0;
            }
        }

        // 3. Logic & Price Calculation (with variant support)
        let serverTotalPrice = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.id);
            if (!product) throw new Error(`المنتج ذو المعرف ${item.id} غير متوفر.`);

            let unitPrice = Number(product.price); // Default: base price
            const attrs = product.attributes as any;

            // Check if this item has variant selections → look up the correct price
            // 3a. Variant-specific Stock Check & Deduction
            if (item.selections && Object.keys(item.selections).length > 0 && attrs?.variantCombinations?.length > 0) {
                const variantOptions = attrs.variantOptions || [];
                const variantCombinations = attrs.variantCombinations || [];

                const optionMap: Record<string, string> = {}; 
                for (const [humanName, selectedValue] of Object.entries(item.selections)) {
                    const opt = variantOptions.find((o: any) => o.name === humanName);
                    if (opt) optionMap[opt.id] = selectedValue as string;
                }

                if (Object.keys(optionMap).length > 0) {
                    const sortedKeys = Object.keys(optionMap).sort();
                    const comboId = sortedKeys.map(k => `${k}:${optionMap[k]}`).join('|');
                    const comboIndex = variantCombinations.findIndex((c: any) => c.id === comboId);
                    
                    if (comboIndex !== -1) {
                        const combo = variantCombinations[comboIndex];
                        const variantStock = parseInt(combo.stock_quantity) || 0;

                        if (variantStock < item.quantity) {
                            throw new Error(`عذراً، الخيار المختار للمنتج "${product.name}" غير متوفر بالكمية المطلوبة (المتوفر: ${variantStock}).`);
                        }

                        // Update price if available
                        if (combo.price && parseFloat(combo.price) > 0) {
                            unitPrice = parseFloat(combo.price);
                        } else if (combo.isUnavailable) {
                            throw new Error(`الخيار المحدد للمنتج "${product.name}" غير متوفر حالياً.`);
                        }

                        // DECREMENT STOCK
                        variantCombinations[comboIndex].stock_quantity = (variantStock - item.quantity).toString();
                        
                        // Sync total stock
                        const newTotalStock = variantCombinations.reduce((acc: number, c: any) => acc + (parseInt(c.stock_quantity) || 0), 0);
                        
                        await supabaseAdmin
                            .from('products')
                            .update({ 
                                attributes: { 
                                    ...attrs, 
                                    variantCombinations,
                                    out_of_stock_since: newTotalStock === 0 ? (attrs.out_of_stock_since || new Date().toISOString()) : null
                                },
                                stock_quantity: newTotalStock
                            })
                            .eq('id', item.id);
                    } else if (attrs?.hasVariants) {
                        throw new Error(`الخيارات المحددة للمنتج "${product.name}" غير صالحة.`);
                    }
                }
            } else {
                // Simple product stock check
                if (product.stock_quantity < item.quantity) {
                     throw new Error(`عذراً، المنتج "${product.name}" غير متوفر بالكمية المطلوبة (المتوفر: ${product.stock_quantity}).`);
                }
                
                // DECREMENT STOCK
                const newStock = Math.max(0, product.stock_quantity - item.quantity);
                const currentAttrs = (product.attributes as any) || {};
                await supabaseAdmin
                    .from('products')
                    .update({ 
                        stock_quantity: newStock,
                        attributes: {
                            ...currentAttrs,
                            out_of_stock_since: newStock === 0 ? (currentAttrs.out_of_stock_since || new Date().toISOString()) : null
                        }
                    })
                    .eq('id', item.id);
            }

            serverTotalPrice += unitPrice * item.quantity;

            validatedItems.push({
                id: item.id,
                quantity: item.quantity,
                name: product.name,
                price: unitPrice, 
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
                order_type: customerInfo.orderType || 'delivery',
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
