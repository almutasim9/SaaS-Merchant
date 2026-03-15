import { motion } from 'framer-motion';

interface CheckoutSuccessModalProps {
    order: any;
    currency: string;
    onClose: () => void;
    onPrintReceipt: (order: any) => void;
}

export const CheckoutSuccessModal = ({
    order,
    currency,
    onClose,
    onPrintReceipt
}: CheckoutSuccessModalProps) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center"
            >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
                <h3 className="text-xl font-black text-black mb-2">تمت العملية بنجاح!</h3>
                <p className="text-xs text-black font-bold mb-8 uppercase tracking-widest px-8">رقم الطلب: #{order.id.slice(0, 8).toUpperCase()}</p>
                
                <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex justify-between items-center border border-slate-100">
                    <span className="text-xs font-black text-black">مجموع الفاتورة</span>
                    <span className="text-2xl font-black text-black font-sans">{order.total} {currency}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onPrintReceipt(order)}
                        className="py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        🖨️ طباعة
                    </button>
                    <button 
                        onClick={onClose}
                        className="py-4 bg-slate-100 text-black rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                    >
                        إغلاق
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
