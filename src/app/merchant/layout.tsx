'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import SectionsModal from './products/SectionsModal';

interface Store {
    id: string;
    name: string;
    slug: string;
}

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    badge?: number | null;
    onClick?: () => void;
}

interface NavigationGroup {
    group: string;
    items: NavigationItem[];
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
    const [store, setStore] = useState<Store | null>(null);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const init = async () => {
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
                cleanup = await fetchStore(user.id);
            }
        };

        init();

        return () => { cleanup?.(); };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Listen to custom event from orders page for instant badge updates
    useEffect(() => {
        const handleStatusUpdate = () => {
            if (store?.id) {
                fetchOrdersCount(store.id);
            }
        };
        window.addEventListener('orderStatusUpdated', handleStatusUpdate);
        return () => window.removeEventListener('orderStatusUpdated', handleStatusUpdate);
    }, [store?.id]);

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

    const navigation: NavigationGroup[] = [
        {
            group: 'الرئيسية',
            items: [
                { id: 'dashboard', label: 'لوحة التحكم', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/merchant/dashboard' },
            ]
        },
        {
            group: 'إدارة المتجر',
            items: [
                { id: 'products', label: 'إدارة المنتجات', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', href: '/merchant/products' },
                { id: 'sections', label: 'إدارة الأقسام', icon: 'M4 6h16M4 12h16m-7 6h7', href: '/merchant/sections' },
                { id: 'delivery', label: 'إدارة التوصيل', icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', href: '/merchant/delivery' },
            ]
        },
        {
            group: 'المبيعات',
            items: [
                { id: 'orders', label: 'الطلبات', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', href: '/merchant/orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
                { id: 'sales-history', label: 'سجل المبيعات', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', href: '/merchant/sales-history' },
            ]
        },
        {
            group: 'الإعدادات',
            items: [
                { id: 'billing', label: 'الباقة والاشتراك', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z', href: '/merchant/billing' },
                { id: 'settings', label: 'إعدادات المتجر', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', href: '/merchant/settings' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex font-sans" dir="rtl">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 right-0 h-screen bg-white border-l border-slate-100 flex flex-col p-8 z-[70] transition-transform duration-500
                w-[280px] lg:w-[300px]
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex items-center justify-between mb-16 px-2 lg:block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3L4 9V21H20V9L12 3ZM12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 leading-tight">{store?.name || 'متجر النخبة'}</h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">حساب التاجر الموثق</span>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {navigation.map((group) => (
                        <div key={group.group} className="space-y-2">
                            <h3 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = (pathname.startsWith(item.href) && item.href !== '/merchant/dashboard') || (pathname === '/merchant/dashboard' && item.id === 'dashboard');

                                    const content = (
                                        <div className={`flex items-center justify-between px-6 py-3.5 rounded-2xl transition-all group cursor-pointer ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>
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
                                        </div>
                                    );

                                    if (item.onClick) {
                                        return (
                                            <div key={item.id} onClick={item.onClick}>
                                                {content}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link key={item.id} href={item.href}>
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
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
                <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-[#F8F9FB]/80 backdrop-blur-md z-40">
                    <div className="flex items-center gap-4">
                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-800 shadow-sm"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>

                        <div className="hidden md:flex items-center gap-4 w-[300px] lg:w-[450px]">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="البحث هنا..."
                                    className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all font-bold shadow-sm"
                                />
                                <svg className="w-5 h-5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        {/* Removed notifications and user avatar */}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 px-4 lg:px-0">
                    {children}
                </main>

                {store && (
                    <SectionsModal
                        isOpen={isSectionsModalOpen}
                        onClose={() => setIsSectionsModalOpen(false)}
                        storeId={store.id}
                    />
                )}
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
