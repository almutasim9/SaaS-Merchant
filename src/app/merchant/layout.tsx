'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Store {
    id: string;
    name: string;
    slug: string;
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
    const [store, setStore] = useState<Store | null>(null);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'merchant') {
            router.push('/login');
        } else {
            fetchStore(user.id);
        }
    };

    const fetchOrdersCount = async (storeId: string) => {
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('status', 'pending');

        setPendingOrdersCount(count || 0);
    };

    const fetchStore = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('stores')
                .select('id, name, slug')
                .eq('merchant_id', userId)
                .single();

            if (data) {
                setStore(data);
                fetchOrdersCount(data.id);

                // Real-time subscription for order count
                const channel = supabase
                    .channel('sidebar-orders-count')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `store_id=eq.${data.id}`
                    }, () => {
                        fetchOrdersCount(data.id);
                    })
                    .subscribe();

                return () => supabase.removeChannel(channel);
            }
        } catch (error) {
            console.error('Error fetching store:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const navigation = [
        { id: 'dashboard', label: 'لوحة التحكم', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', href: '/merchant/dashboard' },
        { id: 'products', label: 'إدارة المنتجات', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', href: '/merchant/products' },
        { id: 'orders', label: 'الطلبات', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', href: '/merchant/orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
        { id: 'settings', label: 'الإعدادات', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', href: '/merchant/settings' }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex font-sans" dir="rtl">
            {/* Sidebar */}
            <aside className="w-[300px] h-screen bg-white border-l border-slate-100 flex flex-col p-8 sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-16 px-2">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3L4 9V21H20V9L12 3ZM12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 leading-tight">{store?.name || 'متجر النخبة'}</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">حساب التاجر الموثق</span>
                    </div>
                </div>

                <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href) && item.href !== '#' || (pathname === '/merchant/dashboard' && item.id === 'dashboard');
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                                    </svg>
                                    <span className="text-sm font-bold">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="pt-8 border-t border-slate-100 px-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all group font-bold text-sm"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Content Header Wrapper */}
            <div className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
                {/* Global Header */}
                <header className="h-24 flex items-center justify-between px-10 sticky top-0 bg-[#F8F9FB]/80 backdrop-blur-md z-40">
                    <div className="flex items-center gap-4 w-[450px]">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="البحث عن منتج أو طلب..."
                                className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all font-bold shadow-sm"
                            />
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 transition-all active:scale-95">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center gap-4 pl-6 h-10 border-l border-slate-200">
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-800 leading-none">{store?.name || 'أحمد العتيبي'}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">مدير المتجر</span>
                            </div>
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 uppercase overflow-hidden shadow-sm">
                                {store?.name?.charAt(0) || 'أ'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </div>
    );
}
