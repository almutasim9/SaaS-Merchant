'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { updateOrderStatusAction } from './actions';

interface Order {
    id: string;
    store_id: string;
    customer_info: {
        name: string;
        phone: string;
        city: string;
        landmark?: string;
        notes?: string;
    };
    items: any[];
    total_price: number;
    delivery_fee: number;
    governorate: string;
    status: string;
    created_at: string;
}

export default function MerchantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
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
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
            calculateStats(data);
        }
        setLoading(false);
    };

    const calculateStats = (orderList: Order[]) => {
        const total = orderList.length;
        const pending = orderList.filter(o => o.status === 'pending').length;
        const processing = orderList.filter(o => o.status === 'processing').length;
        const completed = orderList.filter(o => o.status === 'completed' || o.status === 'delivered').length;

        // Only count completed/delivered orders in total sales revenue from the *active* view if somehow they are here,
        // but since we filter them out of the list, this active view might not have them.
        // Wait, if an order is completed, we should probably fetch the total completed from DB if we really wanted accurate stats,
        // but keeping it simple for now based on what's visible.
        const completedOrders = orderList.filter(o => o.status === 'completed' || o.status === 'delivered');
        const sum = completedOrders.reduce((acc, curr) => acc + curr.total_price, 0);
        const avg = completedOrders.length > 0 ? sum / completedOrders.length : 0;

        setStats({ total, pending, processing, completed, avgValue: avg });
    };

    const subscribeToOrders = (storeId: string) => {
        const subscription = supabase
            .channel('orders-realtime-premium')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
            }, (payload) => {
                if (payload.new && payload.new.store_id === storeId) {
                    toast.success('طلب جديد!', { description: 'لقد استلمت طلباً جديداً للتو من متجرك.' });
                    // Append new order locally instead of full refetch
                    const newOrder = payload.new as Order;
                    setOrders(prev => [newOrder, ...prev]);
                    setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
                }
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        // Optimistic update
        const previousOrders = [...orders];

        if (newStatus === 'completed' || newStatus === 'cancelled') {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        }

        // If updating the selected order, also update it locally
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }

        const result = await updateOrderStatusAction(orderId, newStatus);

        if (!result.success) {
            toast.error(result.error || 'حدث خطأ أثناء تحديث حالة الطلب');
            setOrders(previousOrders); // Revert on error
        } else {
            toast.success('تم تحديث حالة الطلب بنجاح');
            if (newStatus === 'completed' || newStatus === 'cancelled') {
                calculateStats(orders.filter(o => o.id !== orderId));
            } else {
                calculateStats(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
            window.dispatchEvent(new Event('orderStatusUpdated'));
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            pending: 'bg-amber-50 text-amber-600',
            processing: 'bg-indigo-50 text-indigo-600',
            shipped: 'bg-blue-50 text-blue-600',
            completed: 'bg-emerald-50 text-emerald-600',
            postponed: 'bg-orange-50 text-orange-600',
            returned: 'bg-rose-50 text-rose-600',
            cancelled: 'bg-slate-100 text-slate-600'
        };
        const labels: any = {
            pending: 'معلق',
            processing: 'قيد التجهيز',
            shipped: 'سلم للمندوب',
            completed: 'مكتمل / مستلم',
            postponed: 'مؤجل',
            returned: 'راجع / مرفوض',
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

    const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

    return (
        <div dir="rtl">
            <div className="print:hidden px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">إدارة الطلبات</h1>
                        <p className="text-slate-400 font-medium mt-1 text-sm">تابع أحدث الطلبات الواردة لمتجرك وقم بتحديث حالاتها.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 lg:flex-none px-4 lg:px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer appearance-none text-right"
                        >
                            <option value="all">كل الطلبات (تصفية)</option>
                            <option value="pending">طلبات معلقة</option>
                            <option value="processing">قيد التجهيز</option>
                            <option value="shipped">سلم للمندوب</option>
                            <option value="completed">طلبات مكتملة</option>
                            <option value="postponed">مؤجل (تأجيل التسليم)</option>
                            <option value="returned">راجع / مرفوض من الزبون</option>
                            <option value="cancelled">طلبات ملغية</option>
                        </select>
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-8 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold text-xs shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">
                            تصدير
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">إجمالي الطلبات</h3>
                            <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">طلبات معلقة</h3>
                            <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-rose-50 text-rose-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">قيد التجهيز</h3>
                            <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.processing}</p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-amber-50 text-amber-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">طلبات مكتملة</h3>
                            <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.completed}</p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-50 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
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
                                            <div className="font-bold text-indigo-600 text-base lg:text-lg tracking-tight">{order.total_price.toLocaleString()} د.ع</div>
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
                                                    className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="bg-slate-50 border-none rounded-xl px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                                                >
                                                    <option value="pending">معلق</option>
                                                    <option value="processing">تجهيز</option>
                                                    <option value="shipped">مندوب</option>
                                                    <option value="completed">مكتمل</option>
                                                    <option value="postponed">مؤجل</option>
                                                    <option value="returned">راجع</option>
                                                    <option value="cancelled">ملغي</option>
                                                </select>
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
                    <div className="print:hidden fixed inset-0 z-[100] flex justify-end">
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
                                            <div className="text-sm font-medium text-slate-600 leading-relaxed">{selectedOrder.governorate}{selectedOrder.customer_info.landmark ? ` — ${selectedOrder.customer_info.landmark}` : ''}</div>
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
                                            <span>المجموع الفرعي</span>
                                            <span>{(selectedOrder.total_price - (selectedOrder.delivery_fee || 0)).toLocaleString()} د.ع</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs lg:text-sm font-medium text-slate-400">
                                            <span>رسوم التوصيل ({selectedOrder.governorate || 'غير محدد'})</span>
                                            <span className="text-amber-600">{(selectedOrder.delivery_fee || 0).toLocaleString()} د.ع</span>
                                        </div>
                                        <div className="pt-4 lg:pt-6 flex justify-between items-center">
                                            <span className="text-lg lg:text-xl font-bold text-slate-800">الإجمالي النهائي</span>
                                            <span className="text-2xl lg:text-4xl font-black text-indigo-600 tracking-tighter">{selectedOrder.total_price.toLocaleString()} د.ع</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 lg:p-10 border-t border-slate-50 bg-[#FBFBFF] sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 lg:gap-4">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="order-2 sm:order-1 flex-[1] py-3.5 lg:py-4 bg-white border border-slate-100 rounded-xl lg:rounded-2xl text-[11px] lg:text-sm text-slate-400 font-bold shadow-sm hover:text-slate-600 transition-all"
                                >
                                    إغلاق
                                </button>
                                <button
                                    onClick={() => setTimeout(() => window.print(), 100)}
                                    className="order-1 sm:order-2 flex-[2] py-3.5 lg:py-4 bg-slate-900 text-white text-[11px] lg:text-sm font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    طباعة وصل للمندوب (طابعة حرارية)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Print View for Thermal Printers (80mm) */}
                {selectedOrder && (
                    <div className="hidden print:block w-[80mm] p-2 text-black font-sans mx-auto text-right text-xs" dir="rtl">
                        <div className="text-center font-bold text-lg mb-2">تفاصيل الطلب</div>
                        <div className="text-center font-bold border-b border-black pb-2 mb-2 text-sm">{(selectedOrder as any).governorate || 'توصيل'}</div>
                        <div className="mb-1"><strong>رقم الطلب:</strong> #{selectedOrder.id.slice(0, 6).toUpperCase()}</div>
                        <div className="mb-1"><strong>العميل:</strong> {selectedOrder.customer_info.name}</div>
                        <div className="mb-1"><strong>المحافظة:</strong> {(selectedOrder as any).governorate || 'غير محدد'}</div>
                        <div className="mb-1"><strong>الهاتف:</strong> {selectedOrder.customer_info.phone}</div>
                        <div className="mb-2"><strong>العنوان:</strong> <span className="whitespace-pre-wrap">{selectedOrder.governorate}{selectedOrder.customer_info.landmark ? ` - ${selectedOrder.customer_info.landmark}` : ''}</span></div>

                        <table className="w-full text-right border-t border-b border-black mt-2 mb-2">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1">المنتج</th>
                                    <th className="py-1">الكمية</th>
                                    <th className="py-1 text-left">السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items.map((i, idx) => (
                                    <tr key={idx}>
                                        <td className="py-1 pr-1">{i.name}</td>
                                        <td className="py-1 text-center">{i.quantity}</td>
                                        <td className="py-1 text-left">{(i.price * i.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-between font-bold text-sm mt-3 pt-2 border-t border-black border-dashed">
                            <span>المجموع (مع التوصيل):</span>
                            <span>{selectedOrder.total_price.toLocaleString()} د.ع</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
