'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
    status: string;
    created_at: string;
}

export default function MerchantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        avgValue: 0
    });

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
            .select('id')
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
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
            calculateStats(data);
        }
        setLoading(false);
    };

    const calculateStats = (orderList: Order[]) => {
        const total = orderList.length;
        const pending = orderList.filter(o => o.status === 'pending' || o.status === 'processing').length;
        const completed = orderList.filter(o => o.status === 'completed').length;
        const sum = orderList.reduce((acc, curr) => acc + curr.total_price, 0);
        const avg = total > 0 ? sum / total : 0;

        setStats({ total, pending, completed, avgValue: avg });
    };

    const subscribeToOrders = (storeId: string) => {
        const subscription = supabase
            .channel('orders-realtime-premium')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${storeId}`
            }, () => {
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

    return (
        <div className="px-10 pb-20 space-y-10" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">إدارة الطلبات</h1>
                    <p className="text-slate-400 font-medium mt-1">تابع أحدث الطلبات الواردة لمتجرك وقم بتحديث حالاتها.</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs shadow-sm hover:shadow-md transition-all">
                        تصفية متقدمة
                    </button>
                    <button className="flex items-center gap-2 px-8 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold text-xs shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">
                        تصدير كـ CSV
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">إجمالي الطلبات</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.total}</p>
                    </div>
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">قيد التجهيز</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.pending}</p>
                    </div>
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 2" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">طلبات مكتملة</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.completed}</p>
                    </div>
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">متوسط الطلب</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.avgValue.toFixed(0)} ر.س</p>
                    </div>
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden whitespace-nowrap">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-[#FBFBFF] border-b border-slate-50">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">رقم الطلب</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">العميل</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">المنتجات</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">المبلغ الإجمالي</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.length > 0 ? orders.map((order, idx) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-6">
                                        <span className="text-sm font-bold text-slate-800 uppercase">#ORD-{idx + 7421}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div>
                                            <div className="font-bold text-slate-800 text-base">{order.customer_info.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{order.customer_info.phone}</div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-slate-800">{order.items.length} منتجات</span>
                                            <span className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[150px]">
                                                {order.items.map(i => i.name).join(', ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className="font-bold text-indigo-600 text-lg tracking-tight">{order.total_price.toLocaleString()} ر.س</div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-10 py-6 text-center text-sm font-medium text-slate-400">
                                        {new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' })}
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                                            >
                                                <option value="pending">معلق</option>
                                                <option value="processing">تجهيز</option>
                                                <option value="completed">مكتمل</option>
                                                <option value="cancelled">ملغي</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800">لا توجد طلبات حالياً</h3>
                                            <p className="text-sm font-medium text-slate-400">ستظهر هنا الطلبات الواردة فوراً عند قيام العملاء بالشراء.</p>
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
                    <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl animate-in slide-in-from-left duration-500 overflow-y-auto">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">تفاصيل <span className="text-indigo-600">الطلب</span></h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">رقم الطلب: #{selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all">
                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-10 space-y-12">
                            {/* Customer Section */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-2">بيانات العميل</h4>
                                <div className="p-8 bg-[#FBFBFF] border border-slate-50 rounded-[2.5rem] space-y-6 shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <span className="text-xl font-bold">{selectedOrder.customer_info.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-800 leading-none">{selectedOrder.customer_info.name}</div>
                                            <div className="text-sm font-medium text-slate-400 mt-1">{selectedOrder.customer_info.phone}</div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-200/50">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase pr-1 mb-2">عنوان التوصيل</div>
                                        <div className="text-sm font-medium text-slate-600 leading-relaxed">{selectedOrder.customer_info.address}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic pr-2">محتويات السلة</h4>
                                <div className="space-y-4">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                                                <img src={item.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800 text-base">{item.name}</div>
                                                <div className="text-xs font-medium text-slate-400 mt-1">{item.quantity} × {item.price} ر.س</div>
                                            </div>
                                            <div className="text-base font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} ر.س</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="pt-10 border-t border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                                        <span>المجموع الفرعي</span>
                                        <span>{selectedOrder.total_price.toLocaleString()} ر.س</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                                        <span>رسوم التوصيل</span>
                                        <span className="text-emerald-500">مجاني</span>
                                    </div>
                                    <div className="pt-6 flex justify-between items-center">
                                        <span className="text-xl font-bold text-slate-800">الإجمالي النهائي</span>
                                        <span className="text-4xl font-black text-indigo-600 tracking-tighter">{selectedOrder.total_price.toLocaleString()} ر.س</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-slate-50 bg-[#FBFBFF] sticky bottom-0 z-10 flex gap-4">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold shadow-sm hover:text-slate-600 transition-all"
                            >
                                إغلاق النافذة
                            </button>
                            <button
                                onClick={async () => {
                                    await updateStatus(selectedOrder.id, 'completed');
                                    setSelectedOrder(null);
                                }}
                                className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
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
