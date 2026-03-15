import { motion } from 'framer-motion';
import { Product } from '../types';
import { findCombination } from '../utils';

interface VariantModalProps {
    product: Product | null;
    selectedOptions: Record<string, string>;
    currency: string;
    onOptionChange: (optionId: string, value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export const VariantModal = ({
    product,
    selectedOptions,
    currency,
    onOptionChange,
    onClose,
    onConfirm
}: VariantModalProps) => {
    if (!product) return null;

    const combination = findCombination(product, selectedOptions);
    const displayPrice = combination ? combination.price : product.price;
    const stock = combination ? combination.stock_quantity : product.stock_quantity;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
                <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">تخصيص المنتج</span>
                            <h3 className="text-2xl font-black text-black mt-2">{product.name}</h3>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-black hover:bg-slate-200 transition-all font-bold">×</button>
                    </div>

                    <div className="space-y-8">
                        {product.attributes?.variantOptions.map((opt: any) => (
                            <div key={opt.id} className="space-y-4">
                                <label className="text-xs font-black text-black uppercase tracking-widest">{opt.name}</label>
                                <div className="flex flex-wrap gap-2">
                                    {opt.values.map((val: string) => {
                                        const isColor = val.startsWith('#');
                                        const isSelected = selectedOptions[opt.id] === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => onOptionChange(opt.id, val)}
                                                className={`min-w-[44px] h-11 px-4 rounded-2xl text-xs font-black transition-all border-2 flex items-center justify-center gap-2 ${isSelected ? 'border-indigo-600 bg-indigo-50 text-black shadow-md ring-4 ring-indigo-50' : 'border-slate-100 bg-white text-black hover:border-slate-200'}`}
                                            >
                                                {isColor && (
                                                    <div 
                                                        className="w-4 h-4 rounded-full border border-black/10" 
                                                        style={{ backgroundColor: val }} 
                                                    />
                                                )}
                                                {!isColor && val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-black font-bold uppercase tracking-widest">السعر المحدد</p>
                            <p className="text-3xl font-black text-black">{displayPrice} <span className="text-sm">{currency}</span></p>
                            <p className={`text-[10px] font-bold mt-1 ${parseInt(stock) === 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {parseInt(stock) === 0 ? 'نفد من المخزن' : `المتوفر: ${stock} قطعة`}
                            </p>
                        </div>
                        <button 
                            onClick={onConfirm}
                            disabled={parseInt(stock) === 0}
                            className="h-16 px-10 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            تأكيد الإضافة للسلة
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
