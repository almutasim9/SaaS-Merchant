'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getNotifications, markAsRead, markAllAsRead } from './actions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function NotificationBell({ storeId }: { storeId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        loadNotifications();

        // Realtime listener
        const channel = supabase
            .channel('merchant_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'merchant_notifications',
                    filter: `store_id=eq.${storeId}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    toast.info(`إشعار جديد: ${payload.new.title}`);
                    // Play notification sound if possible
                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.play();
                    } catch (e) {}
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadNotifications() {
        const data = await getNotifications();
        setNotifications(data);
    }

    async function handleMarkAsRead(id: string) {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }

    async function handleMarkAllAsRead() {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success('تم تحديد الكل كمقروء');
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-black hover:bg-slate-100 transition-all border border-slate-200"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-sm text-black">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-bold text-black hover:text-indigo-700 uppercase"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs text-black font-medium">لا توجد إشعارات حالياً</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${n.type === 'order' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                {n.type === 'order' ? 'طلب جديد' : 'تحديث'}
                                            </span>
                                            <span className="text-[9px] text-black">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                                            </span>
                                        </div>
                                        <h4 className={`text-xs ${!n.is_read ? 'font-black text-black' : 'font-bold text-black'}`}>{n.title}</h4>
                                        <p className="text-[10px] text-black mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
