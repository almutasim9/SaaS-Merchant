'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/components/providers/I18nProvider';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    body: string;
    created_at: string;
    is_read: boolean;
    type: string;
    metadata?: any;
}

export default function NotificationBell() {
    const { t } = useI18n();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('merchant-notifications-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'merchant_notifications',
            }, (payload) => {
                const newNotif = payload.new as Notification;
                setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('merchant_notifications')
            .select('*')
            .eq('merchant_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) {
            setNotifications(data);
            const { count } = await supabase
                .from('merchant_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        }
    };

    const markAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('merchant_notifications')
            .update({ is_read: true })
            .eq('merchant_id', user.id)
            .eq('is_read', false);

        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            markAsRead();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-black animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">{t('header.notifications')}</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-full">
                                {unreadCount} جديد
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-200">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </div>
                                <p className="text-xs font-bold text-slate-400">{t('header.noNotifications')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <Link
                                        key={notif.id}
                                        href={notif.metadata?.url || '/merchant/notifications'}
                                        onClick={() => setIsOpen(false)}
                                        className={`block p-5 transition-all hover:bg-slate-50 ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${notif.type === 'order' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {notif.type === 'order' ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 mb-0.5 truncate">{notif.title}</p>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{notif.body}</p>
                                                <p className="text-[9px] text-slate-400 mt-2 font-medium">
                                                    {new Date(notif.created_at).toLocaleTimeString('ar-IQ', { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link
                        href="/merchant/notifications"
                        onClick={() => setIsOpen(false)}
                        className="block p-4 bg-slate-50 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-all border-t border-slate-100"
                    >
                        {t('header.viewAll')}
                    </Link>
                </div>
            )}
        </div>
    );
}
