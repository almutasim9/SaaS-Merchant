import { motion, AnimatePresence } from 'framer-motion';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discount: { type: 'fixed' | 'percent', value: number };
    onDiscountChange: (discount: { type: 'fixed' | 'percent', value: number }) => void;
}

export const DiscountModal = ({
    isOpen,
    onClose,
    discount,
    onDiscountChange
}: DiscountModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl"
            >
                <h3 className="text-xl font-black text-black mb-6 flex items-center gap-3">🎟️ إضافة خصم</h3>
                
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                    <button 
                        onClick={() => onDiscountChange({ ...discount, type: 'fixed' })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${discount.type === 'fixed' ? 'bg-white text-black shadow-sm' : 'text-black'}`}
                    >مبلغ ثابت</button>
                    <button 
                        onClick={() => onDiscountChange({ ...discount, type: 'percent' })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${discount.type === 'percent' ? 'bg-white text-black shadow-sm' : 'text-black'}`}
                    >نسبة مئوية %</button>
                </div>

                <input 
                    autoFocus
                    type="number"
                    value={discount.value || ''}
                    onChange={(e) => onDiscountChange({ ...discount, value: Number(e.target.value) })}
                    placeholder="أدخل القيمة هنا..."
                    className="w-full h-16 bg-slate-100 border-none rounded-2xl px-6 text-xl font-black focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all outline-none mb-6 text-center"
                />

                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 transition-all"
                >تطبيق الخصم</button>
            </motion.div>
        </div>
    );
};
