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
    const [searchQuery, setSearchQuery] = useState('');


    const router = useRouter();

    useEffect(() => {
        checkMerchant();
    }, []);

    const checkMerchant = async () => {
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
            fetchOrders(storeData.id);
            subscribeToOrders(storeData.id);
        } else {
            setLoading(false);
        }
    };

    const fetchOrders = async (storeId: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', storeId)
            .in('status', ['completed', 'delivered', 'cancelled'])
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const subscribeToOrders = (storeId: string) => {
        const subscription = supabase
            .channel('orders-realtime-premium')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${storeId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    toast.success('طلب جديد!', { description: 'لقد استلمت طلباً جديداً للتو من متجرك.' });
                }
                fetchOrders(storeId);
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">سجل المبيعات</h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">استعرض جميع الطلبات المكتملة والملغية وتتبع مبيعاتك السابقة.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 lg:gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
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
                        className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-medium text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto flex-1 lg:flex-none px-4 lg:px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer appearance-none text-right"
                    >
                        <option value="all">كل الطلبات (تصفية)</option>
                        <option value="completed">طلبات مكتملة</option>
                        <option value="cancelled">طلبات ملغية</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
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
                                    <td className="px-6 lg:px-10 py-6">
                                        <span className="text-sm font-bold text-slate-800 uppercase">#{order.id.slice(0, 6).toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-right">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm lg:text-base">{order.customer_info.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{order.customer_info.phone}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-slate-800">{order.items.length} منتجات</span>
                                            <span className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[150px]">
                                                {order.items.map(i => i.name).join(', ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <div className="font-bold text-indigo-600 text-base lg:text-lg tracking-tight">{(order.total_price - (order.delivery_fee || 0)).toLocaleString()} د.ع</div>
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center text-[11px] lg:text-sm font-medium text-slate-400">
                                        {new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' })}
                                    </td>
                                    <td className="px-6 lg:px-10 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2 lg:gap-3">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-4 py-2 bg-slate-50 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                التفاصيل
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 lg:px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
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
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-2">محتويات السلة ({selectedOrder.items.length})</h4>
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
