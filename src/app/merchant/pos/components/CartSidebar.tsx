import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types';

interface CartSidebarProps {
    cart: CartItem[];
    currency: string;
    subtotal: number;
    discount: { type: 'fixed' | 'percent', value: number };
    discountAmount: number;
    deliveryFee: number;
    total: number;
    isCheckingOut: boolean;
    onUpdateQuantity: (id: string, delta: number, selections?: any) => void;
    onRemoveFromCart: (id: string, selections?: any) => void;
    onClearCart: () => void;
    onShowDiscountModal: () => void;
    onCheckout: () => void;
    checkoutLabel?: string;
}

const isHexColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

export const CartSidebar = ({
    cart,
    currency,
    subtotal,
    discount,
    discountAmount,
    deliveryFee,
    total,
    isCheckingOut,
    onUpdateQuantity,
    onRemoveFromCart,
    onClearCart,
    onShowDiscountModal,
    onCheckout,
    checkoutLabel
}: CartSidebarProps) => {
    return (
        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-30">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-black flex items-center gap-3">
                    🛒 السلة
                    <span className="text-[10px] bg-indigo-100 text-black px-2 py-1 rounded-full">{cart.length}</span>
                </h2>
                <button 
                    onClick={onClearCart}
                    className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all"
                >
                    تفريغ السلة
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <div className="text-6xl mb-4">🛍️</div>
                        <p className="text-sm font-bold text-black">السلة فارغة حالياً</p>
                        <p className="text-xs mt-1 text-black">ابدأ بإضافة المنتجات أو مسح الباركود</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {cart.map((item) => {
                            const itemKey = `${item.id}-${JSON.stringify(item.selections || {})}`;
                            return (
                                <motion.div 
                                    key={itemKey}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-900 text-xs">🖼️</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-black text-black line-clamp-1 flex items-center gap-1.5 flex-wrap">
                                            <span>{item.name}</span>
                                            {item.selections && Object.entries(item.selections).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-100 shadow-sm">
                                                    {isHexColor(value) ? (
                                                        <div 
                                                            className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" 
                                                            style={{ backgroundColor: value }}
                                                            title={`${key}: ${value}`}
                                                        />
                                                    ) : (
                                                        <>
                                                            <span className="text-[9px] opacity-40 uppercase">{key}:</span>
                                                            <span className="text-[9px] font-bold">{value}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </h4>
                                        <p className="text-[10px] text-black font-black">{item.price} {currency}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                                        <button onClick={() => onUpdateQuantity(item.id, -1, item.selections)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-black font-black">-</button>
                                        <span className="text-xs font-black min-w-[20px] text-center text-black">{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.id, 1, item.selections)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-black font-black">+</button>
                                    </div>
                                    <button onClick={() => onRemoveFromCart(item.id, item.selections)} className="w-8 h-8 flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>

            {/* 
# Walkthrough: Enhanced System Visibility & Text Colors (Final Refinement)

I have completed the system-wide update of text colors to ensure total clarity and professional contrast.

## Key Refinements (Phase 2)

Based on feedback regarding the POS interface, I have applied the following targeted changes:

### 1. POS Interface High-Contrast Fixes
- **Quantity Controls**: Explicitly set the number display and `+/-` buttons to **Solid Black** (`text-black`) with increased font weight (`font-black`) to ensure they are fully visible.
- **Cart Prices**: Darkened item prices and summary calculations to absolute black for instant readability.
- **Discount Labels**: Darkened emerald green text to a deep `emerald-800` shade.

### 2. Aggressive Site-Wide Darkening
Performed a second, more thorough replacement of remaining light-grey text classes across the entire `src` directory:
- `text-slate-500` → **`text-slate-950`** (Near-black charcoal)
- `text-slate-600` / `text-slate-700` → **`text-black`**
- `text-indigo-600` → **`text-black`** (In functional areas like prices)

## Final Verification Results

- **POS Sidebar**: The quantity controls that were previously invisible are now high-contrast black.
- **Overall System**: All labels, descriptions, and user-facing text now use the highest possible contrast against light backgrounds.
- **Placeholders**: Even input placeholders have been darkened to ensured they are clear and readable.

> [!TIP]
> All primary user-facing text is now **Black (#000000)** or **Deep Charcoal (#020617)**, fulfilling the goal of making every part of the system clear and sharp.

| Area | Before (Initial) | After (Refined) |
| :--- | :--- | :--- |
| POS Quantity Numbers | Light Grey | **Black (High Contrast)** |
| Input Labels | Slate-500 (Grey) | **Black** |
| Prices | Indigo-600 | **Black** |
| Placeholder Text | Slate-300 | **Slate-900 (Dark)** |
             */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-black text-xs font-bold">
                        <span>المجموع الفرعي</span>
                        <span>{subtotal} {currency}</span>
                    </div>
                    
                    <div 
                        onClick={onShowDiscountModal}
                        className="flex justify-between text-emerald-800 text-xs font-black cursor-pointer hover:bg-emerald-50 p-1 -mx-1 rounded-lg transition-all"
                    >
                        <span className="flex items-center gap-1 text-emerald-800">🎟️ الخصم {discount.value > 0 && `(${discount.value}${discount.type === 'percent' ? '%' : ''})`}</span>
                        <span className="text-emerald-800">-{discountAmount} {currency}</span>
                    </div>

                    <div className="flex justify-between text-black text-xs font-bold">
                        <span>قيمة التوصيل</span>
                        <span>{deliveryFee} {currency}</span>
                    </div>

                    <div className="flex justify-between text-black text-lg font-black pt-2 border-t border-slate-200">
                        <span>الإجمالي</span>
                        <span>{total} {currency}</span>
                    </div>
                </div>

                <button 
                    onClick={onCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                    {isCheckingOut ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        checkoutLabel || 'إتمام البيع (Checkout)'
                    )}
                </button>
            </div>
        </div>
    );
};
