'use client';

import React from 'react';
import Image from 'next/image';

interface CartItem {
    id: string;
    cartKey: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    selections?: Record<string, string>;
}

interface CartViewProps {
    items: CartItem[];
    onUpdateQuantity: (cartKey: string, q: number) => void;
    onRemoveItem: (cartKey: string) => void;
    onContinue: () => void;
    onBack: () => void;
    totalPrice: number;
}

export default function CartView({ items, onUpdateQuantity, onRemoveItem, onContinue, onBack, totalPrice }: CartViewProps) {
    return (
        <div className="min-h-screen bg-white" dir="rtl">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">سلة المشتريات</h1>
                    <div className="w-10" />
                </div>
            </header>

            {items.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center text-center py-24 px-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">سلتك فارغة</h3>
                    <p className="text-sm text-slate-400 mb-6">لم تضف أي منتجات بعد</p>
                    <button
                        onClick={onBack}
                        className="px-8 py-3 text-white rounded-xl font-bold text-sm active:scale-95 transition-all shadow-lg hover:brightness-95"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                        تصفح المنتجات
                    </button>
                </div>
            ) : (
                <>
                    {/* Cart Items */}
                    <div className="px-4 pt-4 pb-48 space-y-3">
                        {items.map((item) => (
                            <div key={item.cartKey} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                <div className="flex gap-3">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-amber-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                                        <Image
                                            src={item.image_url || '/placeholder-product.png'}
                                            alt={item.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">{item.name}</h4>
                                            {/* Delete */}
                                            <button
                                                onClick={() => onRemoveItem(item.cartKey)}
                                                className="w-8 h-8 flex-shrink-0 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Selections */}
                                        {item.selections && Object.keys(item.selections).length > 0 && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {Object.entries(item.selections).map(([, val]) => val).join(' · ')}
                                            </p>
                                        )}

                                        {/* Price + Quantity */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.cartKey, Math.max(1, item.quantity - 1))}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors text-base font-bold"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors text-base font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-base font-bold text-[var(--theme-primary)]">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                                                <span className="text-xs text-[var(--theme-primary)]">د.ع</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Bottom */}
                    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-5 pt-4 pb-6 z-50 safe-area-bottom">
                        {/* Total */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800">الإجمالي</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black text-[var(--theme-primary)]">{totalPrice.toLocaleString()} د.ع</span>
                                <span className="text-sm text-[var(--theme-primary)]">د.ع</span>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={onContinue}
                            className="w-full h-13 py-3.5 bg-[var(--theme-primary)] text-white rounded-xl font-bold text-base shadow-lg shadow-sm hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            إتمام الطلب
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
