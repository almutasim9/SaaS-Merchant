'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format-currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [storeCurrency, setStoreCurrency] = useState<'IQD' | 'USD'>('IQD');
    const [storeSlug, setStoreSlug] = useState('');

    // New simplified filter state
    const [rawStartDate, setRawStartDate] = useState('');
    const [rawEndDate, setRawEndDate] = useState('');
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');
    const [appliedPeriod, setAppliedPeriod] = useState<'day' | 'week' | 'month'>('day');

    const handleApplyFilters = () => {
        setAppliedStartDate(rawStartDate);
        setAppliedEndDate(rawEndDate);
        setAppliedPeriod(period);
    };

    const [chartData, setChartData] = useState<any[]>([]);

    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        cancelledOrders: 0,
        aov: 0,
        totalVisits: 0,
        linkVisits: 0,
        qrVisits: 0,
        conversionRate: 0,
    });

    const [topProducts, setTopProducts] = useState<{ name: string, quantity: number, revenue: number }[]>([]);

    useEffect(() => {
        // Initialize with default dates (last 7 days) if not already initialized
        if (appliedStartDate) return;

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        setRawStartDate(startStr);
        setRawEndDate(endStr);
        setAppliedStartDate(startStr);
        setAppliedEndDate(endStr);
        setAppliedPeriod('day');
    }, [appliedStartDate]);

    useEffect(() => {
        if (!appliedStartDate || !appliedEndDate) return;
        fetchAnalytics();
    }, [appliedStartDate, appliedEndDate, appliedPeriod]);

    const fetchAnalytics = async () => {
        if (!appliedStartDate || !appliedEndDate) return;
        try {
            setLoading(true);

            // 1. Get current store
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: store } = await supabase
                .from('stores')
                .select('id, currency_preference, slug, subscription_plans(name_en)')
                .eq('merchant_id', user.id)
                .single();

            if (!store) return;

            const planName = (store.subscription_plans as any)?.name_en || 'Free';
            if (planName !== 'Gold') {
                setHasAccess(false);
                setLoading(false);
                return;
            }

            setStoreCurrency(store.currency_preference || 'IQD');
            setStoreSlug(store.slug || '');

            // Build Date Filter
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            if (appliedStartDate) startDate = new Date(appliedStartDate);
            if (appliedEndDate) {
                endDate = new Date(appliedEndDate);
                endDate.setHours(23, 59, 59, 999);
            }

            // 2. Fetch Orders
            let ordersQuery = supabase
                .from('orders')
                .select('total_price, items, status, created_at')
                .eq('store_id', store.id);

            if (startDate) {
                ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
            }
            if (endDate) {
                ordersQuery = ordersQuery.lte('created_at', endDate.toISOString());
            }

            const { data: orders } = await ordersQuery;

            let totalRevenue = 0;
            let totalOrders = 0;
            let cancelledOrders = 0;
            const productStats: Record<string, { quantity: number, revenue: number }> = {};
            const dailyData: Record<string, { date: string, revenue: number, orders: number }> = {};

            if (orders) {
                orders.forEach(order => {
                    if (order.status === 'completed') {
                        totalOrders++;
                        totalRevenue += order.total_price || 0;

                        // Parse date for chart 
                        const orderDate = new Date(order.created_at).toLocaleDateString('en-GB'); // DD/MM/YYYY
                        if (!dailyData[orderDate]) {
                            dailyData[orderDate] = { date: orderDate, revenue: 0, orders: 0 };
                        }
                        dailyData[orderDate].revenue += order.total_price || 0;
                        dailyData[orderDate].orders += 1;

                        // Aggregate products for completed orders only
                        const items = Array.isArray(order.items) ? order.items : [];
                        items.forEach((item: any) => {
                            const productName = item.name || 'منتج غير معروف';
                            if (!productStats[productName]) {
                                productStats[productName] = { quantity: 0, revenue: 0 };
                            }
                            productStats[productName].quantity += (item.quantity || 1);
                            productStats[productName].revenue += ((item.price || 0) * (item.quantity || 1));
                        });
                    } else if (order.status === 'cancelled' || order.status === 'returned') {
                        cancelledOrders++;
                    }
                });
            }

            // Convert dialyData to array and sort chronologically
            const chartDataArray = Object.values(dailyData).sort((a, b) => {
                const [aD, aM, aY] = a.date.split('/');
                const [bD, bM, bY] = b.date.split('/');
                return new Date(`${aY}-${aM}-${aD}`).getTime() - new Date(`${bY}-${bM}-${bD}`).getTime();
            });

            // Sort Top Products
            const sortedProducts = Object.entries(productStats)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            let visitsQuery = supabase
                .from('store_visits')
                .select('source, created_at')
                .eq('store_id', store.id);

            if (startDate) {
                visitsQuery = visitsQuery.gte('created_at', startDate.toISOString());
            }
            if (endDate) {
                visitsQuery = visitsQuery.lte('created_at', endDate.toISOString());
            }

            const { data: visits } = await visitsQuery;

            let linkVisits = 0;
            let qrVisits = 0;
            const groupedData: Record<string, any> = {};

            // Helper to get grouping key
            const getGroupKey = (dateStr: string) => {
                const date = new Date(dateStr);
                if (appliedPeriod === 'day') {
                    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
                } else if (appliedPeriod === 'week') {
                    // Get ISO week
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                    return `أسبوع ${weekNo} - ${d.getUTCFullYear()}`;
                } else {
                    return `${date.getMonth() + 1}/${date.getFullYear()}`; // MM/YYYY
                }
            };

            if (visits) {
                visits.forEach(visit => {
                    if (visit.source === 'link') linkVisits++;
                    if (visit.source === 'qr') qrVisits++;

                    const visitDateStr = new Date(visit.created_at).toISOString().split('T')[0];
                    const key = getGroupKey(visitDateStr);

                    if (!groupedData[key]) {
                        groupedData[key] = { date: key, revenue: 0, orders: 0, cancelled_orders: 0, qr_visits: 0, link_visits: 0, conversion: 0, aov: 0 };
                    }

                    if (visit.source === 'link') groupedData[key].link_visits += 1;
                    if (visit.source === 'qr') groupedData[key].qr_visits += 1;
                });
            }

            // Group Orders
            if (orders) {
                orders.forEach(order => {
                    const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
                    const key = getGroupKey(orderDateStr);

                    if (!groupedData[key]) {
                        groupedData[key] = { date: key, revenue: 0, orders: 0, cancelled_orders: 0, qr_visits: 0, link_visits: 0, conversion: 0, aov: 0 };
                    }

                    if (order.status === 'completed') {
                        groupedData[key].revenue += order.total_price || 0;
                        groupedData[key].orders += 1;
                    } else if (order.status === 'cancelled' || order.status === 'returned') {
                        groupedData[key].cancelled_orders += 1;
                    }
                });
            }

            let finalChartData: any[] = [];

            if (appliedPeriod === 'day' && startDate && endDate) {
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toLocaleDateString('en-GB');
                    if (groupedData[dateStr]) {
                        groupedData[dateStr].conversion = groupedData[dateStr].qr_visits + groupedData[dateStr].link_visits > 0
                            ? ((groupedData[dateStr].orders / (groupedData[dateStr].qr_visits + groupedData[dateStr].link_visits)) * 100).toFixed(1)
                            : 0;
                        groupedData[dateStr].aov = groupedData[dateStr].orders > 0
                            ? (groupedData[dateStr].revenue / groupedData[dateStr].orders)
                            : 0;
                        finalChartData.push(groupedData[dateStr]);
                    } else {
                        finalChartData.push({ date: dateStr, revenue: 0, orders: 0, cancelled_orders: 0, qr_visits: 0, link_visits: 0, conversion: 0, aov: 0 });
                    }
                }
            } else {
                finalChartData = Object.values(groupedData).map((d: any) => {
                    d.conversion = d.qr_visits + d.link_visits > 0 ? ((d.orders / (d.qr_visits + d.link_visits)) * 100).toFixed(1) : 0;
                    d.aov = d.orders > 0 ? (d.revenue / d.orders) : 0;
                    return d;
                });

                // Sort appropriately for week/month 
                finalChartData.sort((a, b) => {
                    if (appliedPeriod === 'month') {
                        const [aM, aY] = a.date.split('/');
                        const [bM, bY] = b.date.split('/');
                        return new Date(`${aY}-${aM}-01`).getTime() - new Date(`${bY}-${bM}-01`).getTime();
                    }
                    return 0; // week sorting is trickier, simplified here
                });
            }

            // Calculate AOV
            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            const totalVisits = linkVisits + qrVisits;

            // Conversion Rate = (Completed Orders / Total Visits) * 100
            const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

            setMetrics({
                totalRevenue,
                totalOrders,
                cancelledOrders,
                aov,
                totalVisits,
                linkVisits,
                qrVisits,
                conversionRate
            });
            setTopProducts(sortedProducts);
            setChartData(finalChartData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!hasAccess) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4" dir="rtl">
                <div className="bg-white rounded-[2rem] p-8 lg:p-12 max-w-md w-full text-center border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-inner relative z-10 border border-amber-100/50">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-black mb-4 tracking-tight relative z-10">ميزة حصرية للمحترفين</h2>
                    <p className="text-black font-medium mb-10 leading-relaxed text-sm lg:text-base relative z-10">
                        تقارير الإحصائيات المتقدمة والتحليلات الدقيقة متوفرة حصرياً لمشتركي <span className="text-amber-600 font-bold">الباقة الذهبية</span>. قم بترقية مستواك للوصول إليها!
                    </p>
                    <a href="/merchant/billing" className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 relative z-10 active:scale-95">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        ترقية الباقة الآن
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const maxProductQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.quantity)) : 1;

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-24" dir="rtl">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight mb-2">الإحصائيات والأداء 📈</h1>
                    <p className="text-black font-medium">نظرة شاملة على أداء متجرك والمبيعات والزيارات.</p>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col xl:flex-row gap-3 w-full md:w-auto items-end xl:items-center">
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="flex items-center justify-end gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto no-scrollbar w-full md:w-auto">
                            <span className="text-black text-sm font-bold pl-2 whitespace-nowrap">من</span>
                            <input
                                type="date"
                                value={rawStartDate}
                                onChange={(e) => setRawStartDate(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-black focus:ring-0 p-2 cursor-pointer outline-none w-full xl:w-auto"
                            />
                            <span className="text-slate-900">-</span>
                            <span className="text-black text-sm font-bold pl-2 whitespace-nowrap">إلى</span>
                            <input
                                type="date"
                                value={rawEndDate}
                                onChange={(e) => setRawEndDate(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-black focus:ring-0 p-2 cursor-pointer outline-none w-full xl:w-auto"
                            />
                        </div>

                        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                            {[
                                { id: 'day', label: 'يوم' },
                                { id: 'week', label: 'أسبوع' },
                                { id: 'month', label: 'شهر' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setPeriod(tab.id as any)}
                                    className={`flex-1 md:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === tab.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-black hover:text-black hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleApplyFilters}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-[42px] px-6 rounded-xl transition-colors shadow-sm w-full xl:w-auto flex items-center justify-center gap-2"
                    >
                        تطبيق
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* 1. Revenue & AOV Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 w-full flex flex-col">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        المبيعات
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]" dir="ltr">
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-black">لا توجد بيانات</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} tickFormatter={(value) => formatCurrency(value, storeCurrency).replace(/[^0-9]/g, '')} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => {
                                            if (name === 'revenue') return [formatCurrency(value, storeCurrency), 'المبيعات'];
                                            if (name === 'aov') return [formatCurrency(value, storeCurrency), 'متوسط الطلب'];
                                            return [value, name];
                                        }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="revenue" name="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Orders Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 w-full flex flex-col">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        الطلبات
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]" dir="ltr">
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-black">لا توجد بيانات</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => {
                                            if (name === 'orders') return [value, 'مكتملة'];
                                            if (name === 'cancelled_orders') return [value, 'مرفوضة'];
                                            return [value, name];
                                        }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="orders" name="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                                    <Line type="monotone" dataKey="cancelled_orders" name="cancelled_orders" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 3. Visits Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 w-full flex flex-col">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        الزيارات
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]" dir="ltr">
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-black">لا توجد بيانات</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => {
                                            if (name === 'link_visits') return [value, 'رابط'];
                                            if (name === 'qr_visits') return [value, 'باركود QR'];
                                            return [value, name];
                                        }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="link_visits" name="link_visits" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                                    <Line type="monotone" dataKey="qr_visits" name="qr_visits" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 4. Conversion Rate Chart */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 w-full flex flex-col">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        معدل التحويل (%)
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]" dir="ltr">
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-black">لا توجد بيانات</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} domain={[0, 100]} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => {
                                            if (name === 'conversion') return [`${value}%`, 'التحويل'];
                                            return [value, name];
                                        }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                                    />
                                    <Line type="monotone" dataKey="conversion" name="conversion" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Sources */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        مصادر الزيارات
                    </h3>

                    <div className="flex items-center justify-center mb-8">
                        <div className="text-center">
                            <p className="text-5xl font-black text-black">{metrics.totalVisits}</p>
                            <p className="text-sm font-bold text-black mt-2 hover:text-black transition-colors">إجمالي الزيارات</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-black flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    زيارات عبر الرابط
                                </span>
                                <span className="font-black text-black">{metrics.linkVisits}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${metrics.totalVisits > 0 ? (metrics.linkVisits / metrics.totalVisits) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-black flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    زيارات عبر الباركود (QR)
                                </span>
                                <span className="font-black text-black">{metrics.qrVisits}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${metrics.totalVisits > 0 ? (metrics.qrVisits / metrics.totalVisits) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        أكثر 5 منتجات مبيعاً
                    </h3>

                    {topProducts.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-black">
                            <svg className="w-12 h-12 mb-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-sm font-medium">لا توجد مبيعات مكتملة بعد</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((product, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between items-center mb-1 relative z-10 pr-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-black flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                            <span className="text-sm font-bold text-black">{product.name}</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-black text-sm">{product.quantity} <span className="text-[10px] text-black font-medium">وحدة</span></div>
                                            <div className="text-[10px] text-black font-bold tracking-widest" dir="ltr">{formatCurrency(product.revenue, storeCurrency)}</div>
                                        </div>
                                    </div>
                                    {/* Background Bar */}
                                    <div className="absolute top-0 right-0 h-full bg-rose-50 rounded-xl -z-0 transition-all duration-1000 ease-out"
                                        style={{ width: `${(product.quantity / maxProductQty) * 100}%` }}></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
