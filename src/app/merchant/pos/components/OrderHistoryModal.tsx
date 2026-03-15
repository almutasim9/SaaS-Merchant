import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    historyData: any[];
    isLoading: boolean;
    currency: string;
    onPrintReceipt: (order: any) => void;
    onRefund: (orderId: string) => void;
    onPartialRefund: (orderId: string, item: any) => void;
}

export const OrderHistoryModal = ({
    isOpen,
    onClose,
    historyData,
    isLoading,
    currency,
    onPrintReceipt,
    onRefund,
    onPartialRefund
}: OrderHistoryModalProps) => {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white pt-12">
                    <div>
                        <h3 className="text-2xl font-black text-black">سجل المبيعات</h3>
                        <p className="text-xs text-black font-bold mt-1 uppercase tracking-widest">آخر 20 عملية بيع من هذا الفرع</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-black hover:bg-slate-200 transition-all font-bold">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {!selectedOrder ? (
                                <motion.div 
                                    key="list"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {historyData?.map((order: any) => (
                                        <div key={order.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-black">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {order.status === 'completed' ? 'تم البيع' : 'ملغى / مسترجع'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-black font-bold">{new Date(order.created_at).toLocaleString('ar-EG')}</p>
                                                <p className="text-sm font-black text-black mt-2">{order.total_price} {currency}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="px-4 py-2 bg-indigo-50 text-black border border-indigo-100 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                >تفاصيل</button>
                                                <button 
                                                    onClick={() => onPrintReceipt({ ...order, total: order.total_price, discountAmount: 0 })}
                                                    className="px-4 py-2 bg-white text-black border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-100 shadow-sm"
                                                >🖨️ وصل</button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="details"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="flex items-center gap-2 text-black font-black text-xs mb-4 hover:underline"
                                    >
                                        ← العودة للقائمة
                                    </button>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-6">
                                        <h4 className="text-sm font-black text-indigo-900 mb-2">طلب رقم #{selectedOrder.id.slice(0, 8).toUpperCase()}</h4>
                                        <p className="text-xs text-indigo-400 font-bold">{new Date(selectedOrder.created_at).toLocaleString('ar-EG')}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-black uppercase tracking-widest px-2">المنتجات في الطلب</h5>
                                        {selectedOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                        {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : "🖼️"}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-black">{item.name}</p>
                                                        <p className="text-[10px] text-black font-bold">{item.quantity} × {item.price} {currency}</p>
                                                    </div>
                                                </div>
                                                {selectedOrder.status === 'completed' && !item.is_refunded && (
                                                    <button 
                                                        onClick={() => onPartialRefund(selectedOrder.id, item)}
                                                        className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                                    >إرجاع المنتج</button>
                                                )}
                                                {item.is_refunded && (
                                                    <span className="text-[10px] font-black text-black bg-slate-100 px-3 py-1.5 rounded-lg italic">تم الإرجاع</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selectedOrder.status === 'completed' && (
                                        <button 
                                            onClick={() => onRefund(selectedOrder.id)}
                                            className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all mt-6"
                                        >إرجاع كامل الطلب</button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
