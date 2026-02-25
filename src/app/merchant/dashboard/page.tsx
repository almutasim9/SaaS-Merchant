'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import OnboardingChecklist from './OnboardingChecklist';

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    orders_count?: number;
}

interface Order {
    id: string;
    customer_info: {
        name: string;
        phone: string;
    };
    created_at: string;
    total_price: number;
    delivery_fee?: number;
    status: string;
}

interface Store {
    id: string;
    name: string;
    slug: string;
    currency?: 'IQD' | string;
}

export default function MerchantDashboard() {
    const [stores, setStores] = useState<Store[]>([]);
    const [activeStoreIdx, setActiveStoreIdx] = useState(0);
    const store = stores[activeStoreIdx] || null;
    const [products, setProducts] = useState<Product[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        newOrders: 0,
        avgOrderValue: 0,
        dailySales: [0, 0, 0, 0, 0, 0, 0] as number[],
        dailyLabels: ['الساعة', 'أمس', 'اليوم'] as string[] // Placeholder
    });
    const [loading, setLoading] = useState(true);
    const [hasSections, setHasSections] = useState(false);

    const router = useRouter();

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
                cleanup = await fetchDashboardData(user.id);
            }
        };

        init();

        return () => { cleanup?.(); };
    }, []);

    const fetchDashboardData = async (userId: string) => {
        setLoading(true);
        try {
            const { data: storesData, error: storeError } = await supabase
                .from('stores')
                .select('id, name, slug, currency')
                .eq('merchant_id', userId);

            if (storeError) throw storeError;
            if (!storesData || storesData.length === 0) throw new Error('لم يتم العثور على متجر لهذا الحساب.');

            setStores(storesData);
            setActiveStoreIdx(0); // Set the first store as active
            const activeStore = storesData[0];

            // Parallel fetch: stats, products, recent orders, and sections count
            const [allOrdersResult, productsResult, ordersResult, sectionsResult] = await Promise.all([
                supabase.from('orders').select('total_price, delivery_fee, status, created_at').eq('store_id', activeStore.id),
                supabase.from('products').select('id, name, price, image_url').eq('store_id', activeStore.id).is('deleted_at', null).limit(3),
                supabase.from('orders').select('id, customer_info, created_at, total_price, delivery_fee, status').eq('store_id', activeStore.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('sections').select('id', { count: 'exact', head: true }).eq('store_id', activeStore.id)
            ]);
            setHasSections((sectionsResult.count || 0) > 0);

            const allOrders = allOrdersResult.data;
            if (allOrdersResult.error) throw allOrdersResult.error;

            if (allOrders) {
                // Only count sales for orders that are delivered/completed
                const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
                const totalSales = completedOrders.reduce((acc, order) => acc + ((order.total_price || 0) - (order.delivery_fee || 0)), 0);

                const newOrdersCount = allOrders.filter(o => o.status === 'pending').length;
                const avg = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

                // Group by Day for Chart (Last 7 Days)
                const last7Days: any[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    d.setDate(d.getDate() - i);
                    last7Days.push({
                        date: d,
                        label: d.toLocaleDateString('ar-IQ', { weekday: 'long' }),
                        total: 0
                    });
                }

                completedOrders.forEach(order => {
                    const orderDate = new Date(order.created_at);
                    orderDate.setHours(0, 0, 0, 0);
                    const day = last7Days.find(d => d.date.getTime() === orderDate.getTime());
                    if (day) {
                        day.total += (order.total_price || 0) - (order.delivery_fee || 0);
                    }
                });

                setStats({
                    totalSales,
                    newOrders: newOrdersCount,
                    avgOrderValue: Number(avg.toFixed(2)),
                    dailySales: last7Days.map(d => d.total),
                    dailyLabels: last7Days.map(d => d.label)
                });
            }

            setProducts(productsResult.data || []);
            setRecentOrders(ordersResult.data || []);

            const subscription = supabase
                .channel('merchant-dashboard-updates')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                }, (payload) => {
                    if (payload.new && payload.new.store_id === activeStore.id) {
                        toast.success('طلب جديد!', { description: 'لقد استلمت طلباً جديداً للتو.' });
                        // Append new order to the list instead of full refetch
                        setRecentOrders(prev => [payload.new as Order, ...prev].slice(0, 5));
                        // Update pending count
                        setStats(prev => ({ ...prev, newOrders: prev.newOrders + 1 }));
                    }
                })
                .subscribe();

            return () => supabase.removeChannel(subscription);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const StatCard = ({ title, value, change, color, icon }: any) => {
        const isPositive = parseFloat(change) >= 0;
        const currencySymbol = 'د.ع';

        return (
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-[#4F46E5]/30 hover:shadow-xl hover:shadow-[#4F46E5]/5 transition-all">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white transition-all shadow-sm`}>
                        {icon}
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {change}
                    </span>
                </div>
                <div>
                    <h3 className="text-slate-400 text-xs lg:text-sm font-bold tracking-widest uppercase mb-2 pr-1">{title}</h3>
                    <div className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter">
                        {typeof value === 'number' && (title.includes('المبيعات') || title.includes('متوسط')) ? `${value.toLocaleString()} ${currencySymbol}` : value}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="px-4 lg:px-10 pb-10 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">لوحة التحكم</h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">مرحباً بك مجدداً، إليك ملخص أداء متجرك اليوم.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                    <a
                        href={`/shop/${store?.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md hover:bg-emerald-100 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        زيارة المتجر
                    </a>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-sm shadow-sm hover:shadow-md transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        آخر 30 يوم
                    </button>
                    <button className="hidden lg:flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/10 hover:bg-indigo-700 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تصدير
                    </button>
                </div>
            </div>

            {/* Onboarding Checklist — shown to new merchants */}
            <OnboardingChecklist
                storeSlug={store?.slug || ''}
                hasProducts={products.length > 0}
                hasSections={hasSections}
                storeConfigured={false}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <StatCard title="إجمالي المبيعات" value={stats.totalSales} change="12.5%" color="indigo" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="الطلبات الجديدة" value={stats.newOrders} change="2.4%" color="rose" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} />
                <StatCard title="متوسط قيمة الطلب" value={stats.avgOrderValue} change="1.2%" color="emerald" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">نظرة عامة على المبيعات</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">أداء المبيعات للأسبوع الحالي</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-slate-400">المبيعات</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                                <span className="text-[10px] font-bold text-slate-400">المتوقع</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[250px] lg:h-[300px] w-full relative pt-10">
                        {(() => {
                            const maxValue = Math.max(...stats.dailySales, 100);
                            const points = stats.dailySales.map((val, i) => ({
                                x: (i / 6) * 800,
                                y: 250 - (val / maxValue) * 200
                            }));

                            const generatePath = (pts: { x: number, y: number }[]) => {
                                if (pts.length === 0) return "";
                                let d = `M ${pts[0].x},${pts[0].y}`;
                                for (let i = 0; i < pts.length - 1; i++) {
                                    const curr = pts[i];
                                    const next = pts[i + 1];
                                    const xc = (curr.x + next.x) / 2;
                                    const yc = (curr.y + next.y) / 2;
                                    d += ` Q ${curr.x},${curr.y} ${xc},${yc}`;
                                }
                                const last = pts[pts.length - 1];
                                d += ` L ${last.x},${last.y}`;
                                return d;
                            };

                            const curvePath = generatePath(points);
                            const fillPath = `${curvePath} L 800,300 L 0,300 Z`;

                            return (
                                <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={fillPath} fill="url(#chartGradient)" />
                                    <path d={curvePath} fill="none" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                            );
                        })()}

                        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-bold text-slate-300 px-2" dir="ltr">
                            {stats.dailyLabels.map((lbl, idx) => (
                                <span key={idx}>{lbl}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-8">الأكثر مبيعاً</h3>
                    <div className="flex-1 space-y-6">
                        {products.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                        <img src={p.image_url || '/placeholder-product.png'} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</h4>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{245 - (idx * 40)} طلب هذا الشهر</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">{p.price.toLocaleString()} د.ع</span>
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 py-4 w-full border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all">
                        عرض جميع المنتجات
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-800">أحدث الطلبات</h2>
                    <button className="text-sm font-bold text-indigo-600 hover:underline">عرض الكل</button>
                </div>

                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse min-w-[800px] lg:min-w-0">
                            <thead className="bg-[#FBFBFF] border-b border-slate-50">
                                <tr>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">رقم الطلب</th>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">العميل</th>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">التاريخ</th>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">المبلغ</th>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">الحالة</th>
                                    <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentOrders.length > 0 ? recentOrders.map((order: any, idx) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 lg:px-10 py-6">
                                            <span className="text-sm font-bold text-slate-800">#ORD-{idx + 7342}</span>
                                        </td>
                                        <td className="px-6 lg:px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {order.customer_info?.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{order.customer_info?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 lg:px-10 py-6 text-sm font-medium text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 lg:px-10 py-6 text-sm font-bold text-slate-800">{order.total_price.toLocaleString()} د.ع</td>
                                        <td className="px-6 lg:px-10 py-6">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold
                                                ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                    order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}
                                            `}>
                                                {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'فيد التنفيذ' : 'ملغي'}
                                            </span>
                                        </td>
                                        <td className="px-6 lg:px-10 py-6">
                                            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-800 transition-all">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 lg:px-10 py-16 text-center text-slate-400 font-bold">لا توجد طلبات حديثة حالياً.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
