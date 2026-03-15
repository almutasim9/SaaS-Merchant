'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Link from 'next/link';
import SectionsModal from './products/SectionsModal';
import PushNotificationManager from '@/components/merchant/PushNotificationManager';
import { I18nProvider, useI18n } from '@/components/providers/I18nProvider';
import NotificationBell from './notifications/NotificationBell';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useStore } from './hooks/useStore';

interface Store {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    merchant_id: string;
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
    return (
        <I18nProvider storageKey="merchant_lang">
            <MerchantLayoutContent>{children}</MerchantLayoutContent>
        </I18nProvider>
    );
}

function MerchantLayoutContent({ children }: { children: React.ReactNode }) {
    const { t, language, dir } = useI18n();
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    }));
    const router = useRouter();
    const pathname = usePathname();

    const { data: store, isLoading: storeLoading } = useStore();

    useEffect(() => {
        if (!storeLoading && !store) {
            // Check if authenticated
            const checkAuth = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) router.push('/login');
            };
            checkAuth();
        }
    }, [store, storeLoading, router]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (store?.id) {
            fetchOrdersCount(store.id);
            
            const channel = supabase
                .channel('sidebar-orders-count')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${store.id}`
                }, () => {
                    fetchOrdersCount(store.id);
                })
                .subscribe();

            const handleStatusUpdate = () => fetchOrdersCount(store.id);
            window.addEventListener('orderStatusUpdated', handleStatusUpdate);

            return () => {
                supabase.removeChannel(channel);
                window.removeEventListener('orderStatusUpdated', handleStatusUpdate);
            };
        }
    }, [store?.id]);

    const fetchOrdersCount = async (storeId: string) => {
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('status', 'pending');

        setPendingOrdersCount(count || 0);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (storeLoading) {
        return (
            <div className={`min-h-screen bg-slate-50 flex items-center justify-center ${language === 'en' ? 'font-sans' : 'font-cairo'}`} dir={dir}>
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const navigation: NavigationGroup[] = [
        {
            group: t('nav.home'),
            items: [
                { id: 'dashboard', label: t('nav.dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/merchant/dashboard' },
            ]
        },
        {
            group: t('nav.storeManagement'),
            items: [
                { id: 'products', label: t('nav.products'), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', href: '/merchant/products' },
                { id: 'sections', label: t('nav.sections'), icon: 'M4 6h16M4 12h16m-7 6h7', href: '/merchant/sections' },
                { id: 'delivery', label: t('nav.delivery'), icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', href: '/merchant/delivery' },
            ]
        },
        {
            group: t('nav.sales'),
            items: [
                { id: 'pos', label: t('nav.pos'), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', href: '/merchant/pos' },
                { id: 'analytics', label: t('nav.analytics'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', href: '/merchant/analytics' },
                { id: 'orders', label: t('nav.orders'), icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', href: '/merchant/orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
                { id: 'sales-history', label: t('nav.salesHistory'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', href: '/merchant/sales-history' },
            ]
        },
        {
            group: t('nav.settingsGroup'),
            items: [
                { id: 'billing', label: t('nav.billing'), icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z', href: '/merchant/billing' },
                { id: 'settings', label: t('nav.settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', href: '/merchant/settings' }
            ]
        }
    ];

    const isFullScreenPage = pathname === '/merchant/pos' || pathname.split('/').slice(-1)[0] === 'edit';

    return (
        <QueryClientProvider client={queryClient}>
            <div className={`min-h-screen bg-[#F8F9FB] flex font-sans ${language === 'en' ? 'font-sans' : 'font-cairo'}`} dir={dir}>
                {/* Mobile Overlay */}
                {isMobileMenuOpen && !isFullScreenPage && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                {!isFullScreenPage && (
                    <aside className={`
                        fixed lg:sticky top-0 ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'} h-screen bg-white border-slate-100 flex flex-col p-8 z-[70] transition-transform duration-500
                        w-[280px] lg:w-[300px]
                        ${isMobileMenuOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full') + ' lg:translate-x-0'}
                    `}>
                        <div className="flex items-center justify-between mb-16 px-2 lg:block">
                            <div className="flex items-center gap-4">
                                {store?.logo_url ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-lg shadow-black/5 flex-shrink-0 bg-white p-1">
                                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain rounded-lg" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 flex-shrink-0">
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3L4 9V21H20V9L12 3ZM12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11Z" />
                                        </svg>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-black leading-tight">{store?.name || 'متجر النخبة'}</h2>
                                    <span className="text-[10px] font-bold text-black uppercase tracking-widest leading-none">حساب التاجر الموثق</span>
                                </div>
                            </div>
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="lg:hidden w-10 h-10 flex items-center justify-center text-black hover:text-black"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <nav className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {navigation.map((group) => (
                                <div key={group.group} className="space-y-2">
                                    <h3 className="px-6 text-[10px] font-black text-black uppercase tracking-widest">{group.group}</h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = (pathname.startsWith(item.href) && item.href !== '/merchant/dashboard') || (pathname === '/merchant/dashboard' && item.id === 'dashboard');

                                            const content = (
                                                <div className={`flex items-center justify-between px-6 py-3.5 rounded-2xl transition-all group cursor-pointer ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-black hover:bg-slate-50 hover:text-black'}`}>
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
                                <svg className={`w-5 h-5 transition-transform ${dir === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {t('nav.logout')}
                            </button>
                        </div>
                    </aside>
                )}

                {/* Content Header Wrapper */}
                <div className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
                    {/* Global Header */}
                    {!isFullScreenPage && (
                        <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-[#F8F9FB]/80 backdrop-blur-md z-40">
                            <div className="flex items-center gap-4">
                                {/* Hamburger Button */}
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="lg:hidden w-11 h-11 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-black shadow-sm"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>

                                <div className="hidden md:flex items-center gap-4 w-[300px] lg:w-[450px]">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            placeholder={t('header.search')}
                                            className={`w-full bg-white border border-slate-100 rounded-2xl px-6 py-3 ${dir === 'rtl' ? 'pr-12' : 'pl-12'} text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all font-bold shadow-sm`}
                                        />
                                        <svg className={`w-5 h-5 text-slate-900 absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-4">
                                {store?.id && <NotificationBell storeId={store.id} />}
                                <LanguageSwitcher />
                            </div>
                        </header>
                    )}

                    {/* Page Content */}
                    <main className={`flex-1 ${!isFullScreenPage ? 'px-4 lg:px-0 pb-24 lg:pb-0' : ''}`}>
                        {children}
                    </main>

                    {store && (
                        <>
                            <SectionsModal
                                isOpen={isSectionsModalOpen}
                                onClose={() => setIsSectionsModalOpen(false)}
                                storeId={store.id}
                            />
                            <PushNotificationManager merchantId={store.merchant_id || store.id} />
                        </>
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

                {/* Mobile Bottom Navigation Bar */}
                {!isFullScreenPage && (
                    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-100 shadow-lg shadow-slate-900/5" dir={dir}>
                        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
                            {[
                                { href: '/merchant/dashboard', label: t('nav.home'), badge: null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
                                { href: '/merchant/products', label: t('nav.products'), badge: null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
                                { href: '/merchant/orders', label: t('nav.orders'), badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
                                { href: '/merchant/analytics', label: t('nav.analytics'), badge: null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
                                { href: '/merchant/sales-history', label: t('nav.salesHistory'), badge: null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
                                { href: '/merchant/settings', label: t('nav.settings'), badge: null, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                            ].map((tab) => {
                                const isActive = (pathname.startsWith(tab.href) && tab.href !== '/merchant/dashboard') || (pathname === '/merchant/dashboard' && tab.href === '/merchant/dashboard');
                                return (
                                    <a key={tab.href} href={tab.href} className="relative flex flex-col items-center gap-0.5 min-w-[56px] py-1">
                                        <span className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-black'
                                            }`}>
                                            {tab.icon}
                                            {tab.badge && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                                    {tab.badge > 9 ? '9+' : tab.badge}
                                                </span>
                                            )}
                                        </span>
                                        <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-black' : 'text-black'
                                            }`}>{tab.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </nav>
                )}

                <ReactQueryDevtools initialIsOpen={false} />
            </div>
        </QueryClientProvider>
    );
}
