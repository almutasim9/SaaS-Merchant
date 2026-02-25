'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
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
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Cancellation modal state
    const [cancelModal, setCancelModal] = useState<{ orderId: string; orderName: string } | null>(null);
    const [cancelReason, setCancelReason] = useState<'returned' | 'cancelled'>('cancelled');
    const [cancelNote, setCancelNote] = useState('');

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        avgValue: 0
    });

    const router = useRouter();

    const { data: qData, isLoading: loading } = useQuery({
        queryKey: ['merchant-orders'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                throw new Error('Not authenticated');
            }

            const { data: storeData } = await supabase
                .from('stores')
                .select('id, currency')
                .eq('merchant_id', user.id)
                .single();

            if (!storeData) throw new Error('Store not found');

            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('id, store_id, customer_info, items, total_price, delivery_fee, governorate, status, created_at')
                .eq('store_id', storeData.id)
                .is('deleted_at', null)
                .in('status', ['pending', 'processing', 'shipped'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                storeId: storeData.id,
                orders: ordersData || []
            };
        }
    });

    useEffect(() => {
        if (qData) {
            setOrders(qData.orders);
            calculateStats(qData.orders);
        }
    }, [qData]);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!qData?.storeId) return;

        const setupSubscription = () => {
            if (channelRef.current) return;
            channelRef.current = supabase
                .channel('orders-realtime-premium')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                }, (payload) => {
                    if (payload.new && payload.new.store_id === qData.storeId) {
                        toast.success('طلب جديد!', { description: 'لقد استلمت طلباً جديداً للتو من متجرك.' });
                        const newOrder = payload.new as Order;
                        setOrders(prev => [newOrder, ...prev]);
                        setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
                    }
                })
                .subscribe();
        };

        const removeSubscription = () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                removeSubscription(); // Pause realtime to save resources
            } else if (document.visibilityState === 'visible') {
                setupSubscription(); // Resume realtime
            }
        };

        // Initial setup
        setupSubscription();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            removeSubscription();
        };
    }, [qData?.storeId]);

    const calculateStats = (orderList: Order[]) => {
        const total = orderList.length;
        const pending = orderList.filter(o => o.status === 'pending').length;
        const processing = orderList.filter(o => o.status === 'processing').length;
        const completed = orderList.filter(o => o.status === 'completed' || o.status === 'delivered').length;

        const completedOrders = orderList.filter(o => o.status === 'completed' || o.status === 'delivered');
        const sum = completedOrders.reduce((acc, curr) => acc + (curr.total_price - (curr.delivery_fee || 0)), 0);
        const avg = completedOrders.length > 0 ? sum / completedOrders.length : 0;

        setStats({ total, pending, processing, completed, avgValue: avg });
    };

    const updateStatus = async (orderId: string, newStatus: string, cancellationReason?: string) => {
        // Optimistic update
        const previousOrders = [...orders];
        const isFinalStatus = ['completed', 'returned', 'cancelled'].includes(newStatus);

        if (isFinalStatus) {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        }

        // If updating the selected order, also update it locally
        if (selectedOrder?.id === orderId) {
            if (isFinalStatus) setSelectedOrder(null);
            else setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }

        const result = await updateOrderStatusAction(orderId, newStatus, cancellationReason);

        if (!result.success) {
            toast.error(result.error || 'حدث خطأ أثناء تحديث حالة الطلب');
            setOrders(previousOrders); // Revert on error
        } else {
            const statusLabels: Record<string, string> = {
                processing: 'قيد التجهيز ✅',
                shipped: 'تم التسليم للمندوب 🚚',
                completed: 'مكتمل بنجاح ✅',
                returned: 'تم تسجيل الإرجاع 🔁',
                cancelled: 'تم إلغاء الطلب ❌',
            };
            toast.success(statusLabels[newStatus] || 'تم تحديث حالة الطلب');
            if (isFinalStatus) {
                calculateStats(orders.filter(o => o.id !== orderId));
            } else {
                calculateStats(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
            window.dispatchEvent(new Event('orderStatusUpdated'));
        }
    };

    const handleCancelConfirm = () => {
        if (!cancelModal) return;
        updateStatus(cancelModal.orderId, cancelReason, cancelNote || undefined);
        setCancelModal(null);
        setCancelNote('');
        setCancelReason('cancelled');
    };

    const openCancelModal = (orderId: string, orderName: string) => {
        setCancelModal({ orderId, orderName });
        setCancelReason('cancelled');
        setCancelNote('');
    };

    // Render contextual action buttons based on current order status
    const OrderActionButtons = ({ order }: { order: Order }) => {
        const status = order.status;
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {status === 'pending' && (
                    <>
                        <button
                            onClick={() => updateStatus(order.id, 'processing')}
                            className="flex-1 h-9 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-600/20"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            موافقة
                        </button>
                        <button
                            onClick={() => openCancelModal(order.id, order.customer_info.name)}
                            className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all active:scale-95"
                            title="إلغاء الطلب"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                )}
                {status === 'processing' && (
                    <>
                        <button
                            onClick={() => updateStatus(order.id, 'shipped')}
                            className="flex-1 h-9 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-600/20"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            تسليم للمندوب
                        </button>
                        <button
                            onClick={() => updateStatus(order.id, 'pending')}
                            className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
                            title="تراجع إلى معلق"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button
                            onClick={() => openCancelModal(order.id, order.customer_info.name)}
                            className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all active:scale-95"
                            title="إلغاء الطلب"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                )}
                {status === 'shipped' && (
                    <>
                        <button
                            onClick={() => updateStatus(order.id, 'completed')}
                            className="flex-1 h-9 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all active:scale-95 shadow-sm shadow-emerald-600/20"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            مكتمل
                        </button>
                        <button
                            onClick={() => updateStatus(order.id, 'processing')}
                            className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
                            title="تراجع إلى قيد التجهيز"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button
                            onClick={() => openCancelModal(order.id, order.customer_info.name)}
                            className="flex-1 h-9 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            راجع / ملغي
                        </button>
                    </>
                )}
            </div>
        );
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
            <div dir="rtl" className="px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                    <div className="space-y-3">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-12 w-32 lg:w-48 bg-slate-200 rounded-2xl"></div>
                        <div className="h-12 w-24 bg-slate-200 rounded-2xl hidden lg:block"></div>
                    </div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 flex items-center justify-between">
                            <div className="space-y-3">
                                <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
                            </div>
                            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-100 rounded-xl lg:rounded-2xl"></div>
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 p-6 space-y-6">
                    <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 w-full bg-slate-50 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const filteredOrders = orders
        .filter(o => statusFilter === 'all' || o.status === statusFilter)
        .filter(o => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                o.customer_info.name.toLowerCase().includes(q) ||
                o.customer_info.phone.includes(q) ||
                o.customer_info.city.toLowerCase().includes(q)
            );
        });

    return (
        <div dir="rtl">
            <div className="print:hidden px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">إدارة الطلبات</h1>
                        <p className="text-slate-400 font-medium mt-1 text-sm">تابع أحدث الطلبات الواردة لمتجرك وقم بتحديث حالاتها.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        {/* Search bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث بالاسم أو رقم الهاتف أو المدينة..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full lg:w-80 bg-white border border-slate-100 rounded-2xl px-5 py-3 pr-12 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm text-right"
                            />
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                        {/* Status filter pills */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'الكل' },
                                { value: 'pending', label: 'معلق' },
                                { value: 'processing', label: 'قيد التجهيز' },
                                { value: 'shipped', label: 'مع المندوب' },
                                { value: 'postponed', label: 'مؤجل' },
                                { value: 'returned', label: 'راجع' },
                                { value: 'cancelled', label: 'ملغي' },
                            ].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === tab.value
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.value !== 'all' && (
                                        <span className="mr-1.5 opacity-70">
                                            ({orders.filter(o => o.status === tab.value).length})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
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

                {/* Mobile Cards (hidden on desktop) */}
                <div className="md:hidden space-y-3">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 p-10 flex flex-col items-center gap-3 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <p className="text-slate-400 font-bold text-sm">لا توجد طلبات</p>
                            <p className="text-slate-300 text-xs">{searchQuery ? 'لا توجد نتائج للبحث' : 'ستظهر الطلبات الجديدة هنا فور ورودها'}</p>
                        </div>
                    ) : filteredOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 uppercase">#{order.id.slice(0, 6).toUpperCase()}</span>
                                    <StatusBadge status={order.status} />
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {new Date(order.created_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <div className="px-4 pb-3 border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{order.customer_info.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <a href={`tel:${order.customer_info.phone}`} className="text-xs text-indigo-600 font-bold">{order.customer_info.phone}</a>
                                            <span className="text-slate-300">·</span>
                                            <span className="text-xs text-slate-400">{order.customer_info.city}</span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-black text-indigo-600">{order.total_price.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 text-left">د.ع — {order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} منتج</p>
                                    </div>
                                </div>
                                {order.customer_info.notes && (
                                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">📝 {order.customer_info.notes}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3">
                                <div className="flex-1">
                                    <OrderActionButtons order={order} />
                                </div>
                                <button onClick={() => setSelectedOrder(order)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <a href={`https://wa.me/${order.customer_info.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders Table (desktop only) */}
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
                                                <span className="text-sm font-bold text-slate-800">{order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} منتجات</span>
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
                                                <div className="w-48">
                                                    <OrderActionButtons order={order} />
                                                </div>
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
                {/* Cancellation Reason Modal */}
                {cancelModal && (
                    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4" dir="rtl">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
                        <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">سبب إنهاء الطلب</h3>
                                <p className="text-xs text-slate-400 mt-1">طلب <span className="font-bold text-slate-600">{cancelModal.orderName}</span></p>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Reason Selection */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setCancelReason('returned')}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${cancelReason === 'returned'
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-slate-100 bg-slate-50 hover:border-amber-200'
                                            }`}
                                    >
                                        <span className="text-2xl">🔁</span>
                                        <span className="text-xs font-black text-slate-700">راجع / مرفوض</span>
                                        <span className="text-[10px] text-slate-400 text-center">العميل رفض الاستلام</span>
                                    </button>
                                    <button
                                        onClick={() => setCancelReason('cancelled')}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${cancelReason === 'cancelled'
                                            ? 'border-rose-400 bg-rose-50'
                                            : 'border-slate-100 bg-slate-50 hover:border-rose-200'
                                            }`}
                                    >
                                        <span className="text-2xl">❌</span>
                                        <span className="text-xs font-black text-slate-700">ملغية</span>
                                        <span className="text-[10px] text-slate-400 text-center">طلب العميل الإلغاء</span>
                                    </button>
                                </div>
                                {/* Optional Note */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ملاحظة (اختياري)</label>
                                    <input
                                        type="text"
                                        value={cancelNote}
                                        onChange={e => setCancelNote(e.target.value)}
                                        placeholder="سبب إضافي أو تفصيل..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-50 flex gap-3">
                                <button
                                    onClick={() => setCancelModal(null)}
                                    className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all"
                                >
                                    تراجع
                                </button>
                                <button
                                    onClick={handleCancelConfirm}
                                    className={`flex-[2] py-3 text-white font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg ${cancelReason === 'returned'
                                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                                        }`}
                                >
                                    {cancelReason === 'returned' ? '🔁 تأكيد الإرجاع' : '❌ تأكيد الإلغاء'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
