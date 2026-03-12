'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PushNotificationManager({ merchantId }: { merchantId: string }) {
    useEffect(() => {
        const setupNotifications = async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    await registerToken();
                } else if (Notification.permission === 'default') {
                    // Show a subtle toast asking them to enable notifications
                    toast('تنبيهات الطلبات الفورية 🛎️', {
                        description: 'قم بتفعيل الإشعارات للحصول على رنين وتنبيه فوري بمجرد وصول طلب جديد لمتجرك، حتى لو كان التطبيق مغلقاً.',
                        action: {
                            label: 'تفعيل الآن',
                            onClick: () => registerToken()
                        },
                        duration: 15000, 
                    });
                }
            }
        };

        const registerToken = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    // Try to insert the token. RLS constraints handle the rest.
                    // Upsert handles adding it safely without duplicates if we defined the table nicely
                    const { error } = await supabase
                        .from('merchant_fcm_tokens')
                        .insert([{ merchant_id: merchantId, token: token }])
                        .select();
                    
                    // Ignore 23505 (unique constraint violation) which just means we already registered this token
                    if (error && error.code !== '23505') {
                        console.error('Error saving FCM token:', error);
                    } else if (!error) {
                        toast.success('تم تفعيل إشعارات المتجر بنجاح!');
                    }
                }
            } catch (err) {
                console.error('Failed to register FCM token:', err);
            }
        };

        setupNotifications();

        // Recursively listen for foreground messages
        const listenForMessages = async () => {
            try {
                const payload: any = await onMessageListener();
                if (payload) {
                    toast(payload.notification?.title || 'إشعار جديد', {
                        description: payload.notification?.body,
                        duration: 8000,
                        icon: '🔔'
                    });
                    // Fire global event to update Sidebar badge count
                    window.dispatchEvent(new Event('orderStatusUpdated'));
                }
                listenForMessages(); // Listen for the next one
            } catch (err) {
                console.log('Firebase messaging foreground listener stopped.', err);
            }
        };

        listenForMessages();
        
    }, [merchantId]);

    return null; // This component doesn't render anything visually by itself
}
