'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Order {
    id: string;
    store_id: string;
    customer_info: {
        name: string;
        phone: string;
        address: string;
    };
    items: any[];
    total_price: number;
    delivery_fee?: number;
    status: string;
    created_at: string;
}

export default function MerchantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [timeRangeFilter, setTimeRangeFilter] = useState('1_month');
    const [storeId, setStoreId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');


    const router = useRouter();

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: storeData } = await supabase
                .from('stores')
                .select('id, currency')
                .eq('merchant_id', user.id)
                .single();

            if (storeData) {
                setStoreId(storeData.id);
                fetchOrders(storeData.id, '1_month');
                cleanup = subscribeToOrders(storeData.id);
            } else {
                setLoading(false);
            }
        };

        init();

        return () => { cleanup?.(); };
    }, []);

    const fetchOrders = async (sId: string, range: string = '1_month') => {
        setLoading(true);
        let fromDate = new Date();
        if (range === '1_week') fromDate.setDate(fromDate.getDate() - 7);
        else if (range === '1_month') fromDate.setMonth(fromDate.getMonth() - 1);
        else if (range === '2_months') fromDate.setMonth(fromDate.getMonth() - 2);
        else if (range === '3_months') fromDate.setMonth(fromDate.getMonth() - 3);

        const { data, error } = await supabase
            .from('orders')
            .select('id, store_id, customer_info, items, total_price, delivery_fee, status, created_at')
            .eq('store_id', sId)
            .in('status', ['completed', 'delivered', 'cancelled'])
            .gte('created_at', fromDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const subscribeToOrders = (storeId: string) => {
        const subscription = supabase
            .channel('orders-history-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${storeId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    toast.success('طلب جديد!', { description: 'لقد استلمت طلباً جديداً للتو من متجرك.' });
                }
                // Refetching with default 1_month since getting latest state in callback is tricky without refs
                fetchOrders(storeId, '1_month');
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('خطأ في تحديث الحالة');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            pending: 'bg-amber-50 text-amber-600',
            processing: 'bg-indigo-50 text-indigo-600',
            completed: 'bg-emerald-50 text-emerald-600',
            cancelled: 'bg-rose-50 text-rose-600'
        };
        const labels: any = {
            pending: 'معلق',
            processing: 'قيد التجهيز',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        return (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${styles[status]}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredOrders = orders.filter(o => {
        const matchStatus = statusFilter === 'all' ? true : o.status === statusFilter;

        let matchDate = true;
        if (dateFilter) {
            const orderDate = new Date(o.created_at).toISOString().split('T')[0];
            matchDate = orderDate === dateFilter;
        }

        const searchLower = searchQuery.toLowerCase();
        const shortId = o.id.slice(0, 6).toLowerCase();
        const matchSearch =
            searchQuery === '' ||
            o.customer_info.phone.includes(searchQuery) ||
            shortId.includes(searchLower) ||
            o.customer_info.name.toLowerCase().includes(searchLower);

        return matchStatus && matchDate && matchSearch;
    });

    return (
        <div className="px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">سجل المبيعات</h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">استعرض جميع الطلبات المكتملة والملغية وتتبع مبيعاتك السابقة.</p>
                </div>
                {/* Search + Date */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="ابحث برقم الهاتف أو الطلب..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-medium text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-medium text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    />
                    <select
                        value={timeRangeFilter}
                        onChange={(e) => {
                            setTimeRangeFilter(e.target.value);
                            if (storeId) fetchOrders(storeId, e.target.value);
                        }}
                        className="px-3 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    >
                        <option value="1_week">آخر أسبوع</option>
                        <option value="1_month">آخر شهر</option>
                        <option value="2_months">آخر شهرين</option>
                        <option value="3_months">آخر 3 أشهر</option>
                    </select>
                </div>
                {/* Status Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {[
                        { value: 'all', label: 'الكل' },
                        { value: 'completed', label: 'مكتملة' },
                        { value: 'cancelled', label: 'ملغية' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${statusFilter === opt.value
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white border border-slate-100 text-slate-500'
                                }`}
                        >
                            {opt.label} ({opt.value === 'all' ? orders.length : orders.filter(o => o.status === opt.value).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <h3 className="font-black text-slate-800">لا توجد طلبات</h3>
                        <p className="text-xs text-slate-400">ستظهر الطلبات المكتملة والملغية هنا</p>
                    </div>
                ) : filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 pt-4 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400 uppercase">#{order.id.slice(0, 6).toUpperCase()}</span>
                                <StatusBadge status={order.status} />
                            </div>
                            <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="px-4 pb-3 border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{order.customer_info.name}</p>
                                    <a href={`tel:${order.customer_info.phone}`} className="text-xs text-indigo-600 font-bold">{order.customer_info.phone}</a>
                                </div>
                                <div className="text-left">
                                    <p className="text-lg font-black text-indigo-600">{(order.total_price - (order.delivery_fee || 0)).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 text-left">د.ع — {order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} منتج</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3">
                            <button
                                onClick={() => setSelectedOrder(order)}
                                className="flex-1 h-9 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                عرض التفاصيل
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[900px]">
                        <thead className="bg-[#FBFBFF] border-b border-slate-50">
                            <tr>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">رقم الطلب</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">العميل</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">المنتجات</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">المبلغ</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                                <th className="px-6 lg:px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 lg:px-10 py-6"><span className="text-sm font-bold text-slate-800 uppercase">#{order.id.slice(0, 6).toUpperCase()}</span></td>
                                    <td className="px-6 lg:px-10 py-6 text-right">
                                        <div className="font-bold text-slate-800 text-sm lg:text-base">{order.customer_info.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{order.customer_info.phone}</div>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <span className="text-sm font-bold text-slate-800">{order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} منتجات</span>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <div className="font-bold text-indigo-600 text-base lg:text-lg tracking-tight">{(order.total_price - (order.delivery_fee || 0)).toLocaleString()} د.ع</div>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 lg:px-10 py-6 text-center text-[11px] lg:text-sm font-medium text-slate-400">
                                        {new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' })}
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 bg-slate-50 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all flex items-center gap-2 mx-auto">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            التفاصيل
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 lg:px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            </div>
                                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">لا توجد طلبات حالياً</h3>
                                            <p className="text-xs lg:text-sm font-medium text-slate-400">ستظهر هنا الطلبات الواردة فوراً عند قيام العملاء بالشراء.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Drawer (Order Details) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative w-full max-w-full lg:max-w-xl bg-white h-screen shadow-2xl animate-in slide-in-from-left lg:slide-in-from-right duration-500 overflow-y-auto">
                        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl lg:text-2xl font-bold text-slate-800">تفاصيل <span className="text-indigo-600">الطلب</span></h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">رقم الطلب: #{selectedOrder.id.slice(0, 6).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:bg-slate-50 rounded-xl lg:rounded-2xl transition-all">
                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 lg:p-10 space-y-8 lg:space-y-12">
                            {/* Customer Section */}
                            <div className="space-y-4 lg:space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-2">بيانات العميل</h4>
                                <div className="p-6 lg:p-8 bg-[#FBFBFF] border border-slate-50 rounded-[2rem] lg:rounded-[2.5rem] space-y-4 lg:space-y-6 shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <span className="text-lg lg:text-xl font-bold">{selectedOrder.customer_info.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="text-base lg:text-lg font-bold text-slate-800 leading-none">{selectedOrder.customer_info.name}</div>
                                            <div className="text-xs lg:text-sm font-medium text-slate-400 mt-1">{selectedOrder.customer_info.phone}</div>
                                        </div>
                                    </div>
                                    <div className="pt-4 lg:pt-6 border-t border-slate-200/50">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase pr-1 mb-2">عنوان التوصيل</div>
                                        <div className="text-sm font-medium text-slate-600 leading-relaxed">{selectedOrder.customer_info.address}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="space-y-4 lg:space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">محتويات السلة ({selectedOrder.items.reduce((acc, item) => acc + (item.quantity || 1), 0)})</h4>
                                <div className="space-y-3 lg:space-y-4">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 lg:gap-6 p-3 lg:p-4 rounded-2xl lg:rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                                                <img src={item.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-800 text-sm lg:text-base truncate">{item.name}</div>
                                                <div className="text-[10px] lg:text-xs font-medium text-slate-400 mt-0.5">{item.quantity} × {item.price.toLocaleString()} د.ع</div>
                                            </div>
                                            <div className="text-sm lg:text-base font-bold text-slate-800 whitespace-nowrap">{(item.price * item.quantity).toLocaleString()} د.ع</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="pt-8 lg:pt-10 border-t border-slate-100">
                                <div className="space-y-3 lg:space-y-4">
                                    <div className="flex justify-between items-center text-xs lg:text-sm font-medium text-slate-400">
                                        <span>سعر المنتجات</span>
                                        <span>{(selectedOrder.total_price - (selectedOrder.delivery_fee || 0)).toLocaleString()} د.ع</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs lg:text-sm font-medium text-slate-400">
                                        <span>رسوم التوصيل</span>
                                        <span className="text-amber-600">{(selectedOrder.delivery_fee || 0).toLocaleString()} د.ع</span>
                                    </div>
                                    <div className="pt-4 lg:pt-6 flex justify-between items-center">
                                        <span className="text-lg lg:text-xl font-bold text-slate-800">إجمالي المبيعات</span>
                                        <span className="text-2xl lg:text-4xl font-black text-indigo-600 tracking-tighter">{(selectedOrder.total_price - (selectedOrder.delivery_fee || 0)).toLocaleString()} د.ع</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 lg:p-10 border-t border-slate-50 bg-[#FBFBFF] sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 lg:gap-4">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="order-2 sm:order-1 flex-1 py-3.5 lg:py-4 bg-white border border-slate-100 rounded-xl lg:rounded-2xl text-[11px] lg:text-sm text-slate-400 font-bold shadow-sm hover:text-slate-600 transition-all"
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={async () => {
                                    await updateStatus(selectedOrder.id, 'completed');
                                    setSelectedOrder(null);
                                }}
                                className="order-1 sm:order-2 flex-[2] py-3.5 lg:py-4 bg-indigo-600 text-white text-[11px] lg:text-sm font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                اعتماد إكمال الطلب
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
