'use client';

import React, { useState, useEffect } from 'react';
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

export default function NotificationsPage() {
    const { t, dir } = useI18n();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('merchant_notifications')
            .select('*')
            .eq('merchant_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('merchant_notifications')
            .update({ is_read: true })
            .eq('merchant_id', user.id)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-10 max-w-4xl mx-auto pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-black mb-2">{t('header.notifications')}</h1>
                    <p className="text-black font-bold text-sm">سجل التنبيهات والطلبات الجديدة لمتجرك</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black text-black hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        تحديد الكل كمقروء
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-black mb-2">{t('header.noNotifications')}</h3>
                    <p className="text-black font-bold text-sm max-w-xs mx-auto">سيظهر لك سجل الإشعارات هنا بمجرد وصول طلبات جديدة أو تنبيهات من النظام.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            href={notif.metadata?.url || '#'}
                            className={`group bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center gap-6 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-600/5 ${!notif.is_read ? 'border-indigo-100 bg-indigo-50/10' : ''}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${notif.type === 'order' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-black'
                                }`}>
                                {notif.type === 'order' ? (
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                ) : (
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-black text-black truncate">{notif.title}</h3>
                                    {!notif.is_read && (
                                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                                    )}
                                </div>
                                <p className="text-black font-bold text-sm leading-relaxed mb-2">{notif.body}</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                        {new Date(notif.created_at).toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50/50 px-2 py-1 rounded-lg">
                                        {new Date(notif.created_at).toLocaleTimeString('ar-IQ', { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-900 transition-all ${dir === 'rtl' ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2'} group-hover:bg-indigo-600 group-hover:text-white`}>
                                <svg className={`w-5 h-5 ${dir === 'ltr' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
