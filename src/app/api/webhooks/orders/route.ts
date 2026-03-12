import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { adminMessaging } from '@/lib/firebase-server';

// This is a secure webhook endpoint called by Supabase when a new order is created.
export async function POST(req: Request) {
    try {
        // 1. Verify Webhook Secret to prevent unauthorized calls
        const authHeader = req.headers.get('x-webhook-secret');
        const secret = process.env.SUPABASE_WEBHOOK_SECRET;

        if (!secret || authHeader !== secret) {
            console.error('Webhook: Unauthorized attempt or SECRET not configured');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse the Supabase payload
        // Example payload: { type: 'INSERT', table: 'orders', record: { ...orderData } }
        const payload = await req.json();

        // Ensure this is an INSERT operation on the orders table
        if (payload?.type !== 'INSERT' || payload?.table !== 'orders') {
            return NextResponse.json({ message: 'Ignored: not an order insert' }, { status: 200 });
        }

        const order = payload.record;
        const storeId = order.store_id;

        if (!storeId) {
            return NextResponse.json({ error: 'No store_id found in order record' }, { status: 400 });
        }

        // Fetch the merchant_id associated with this store
        const { data: storeData, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('merchant_id')
            .eq('id', storeId)
            .single();

        if (storeError || !storeData) {
            console.error('Error fetching merchant_id from store:', storeError);
            return NextResponse.json({ error: 'Failed to resolve merchant' }, { status: 500 });
        }

        const merchantId = storeData.merchant_id;

        // Fetch FCM tokens for this merchant from the database
        const { data: tokensData, error } = await supabaseAdmin
            .from('merchant_fcm_tokens')
            .select('token')
            .eq('merchant_id', merchantId);

        if (error) {
            console.error('Error fetching FCM tokens:', error);
            return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
        }

        if (!tokensData || tokensData.length === 0) {
            console.log(`No FCM tokens found for merchant ${merchantId}. Skipping notification.`);
            return NextResponse.json({ message: 'No devices registered for notifications' }, { status: 200 });
        }

        // Extract tokens into an array
        const tokens = tokensData.map((t) => t.token);

        // Prepare the FCM push notification message
        const message = {
            notification: {
                title: '🛒 طلب جديد!',
                body: `لقد استلمت طلباً جديداً بقيمة ${order.total_amount} د.ع`,
            },
            data: {
                orderId: String(order.id),
                url: `/merchant/orders`, // The frontend uses this to navigate on click
            },
            tokens: tokens, // Multicast: send to all devices registered by this merchant
        };

        // Send the notifications using Firebase Admin
        const response = await adminMessaging.sendEachForMulticast(message);
        console.log(`FCM Notifications sent. Success: ${response.successCount}, Failures: ${response.failureCount}`);

        // Cleanup stale tokens if any failed (e.g., user uninstalled PWA)
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                // Delete invalid tokens from the database to clean up
                await supabaseAdmin
                    .from('merchant_fcm_tokens')
                    .delete()
                    .in('token', failedTokens);
                console.log(`Cleaned up ${failedTokens.length} invalid tokens.`);
            }
        }

        return NextResponse.json({ success: true, message: 'Notification processed' }, { status: 200 });
    } catch (err: any) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}
