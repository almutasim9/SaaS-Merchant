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
        <div className="min-h-screen bg-[#FAFBFF] text-right pb-40 animate-in fade-in duration-700" dir="rtl">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-8 py-8 flex items-center justify-between shadow-[0_1px_0_rgb(0,0,0,0.05)]">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">حقيبة التسوق</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">لديك {items.length} قطع في السلة</p>
                </div>
                <button
                    onClick={onBack}
                    className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                {items.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                        <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-slate-200/50 border border-slate-50 rotate-6 group-hover:rotate-0 transition-transform">
                            <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">سلة فارغة</p>
                            <p className="text-2xl font-black text-slate-400">حقيبتك ليست ممتلئة بعد.</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black tracking-tight shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                        >
                            اكتشف المجموعات الجديدة
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.cartKey} className="group flex gap-6 p-6 bg-white rounded-[3.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 relative overflow-hidden">
                                    <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-inner relative">
                                        <Image
                                            src={item.image_url || '/placeholder-product.png'}
                                            alt={item.name}
                                            fill
                                            sizes="128px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-2">
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                                                <button
                                                    onClick={() => onRemoveItem(item.cartKey)}
                                                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12 active:scale-75"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-slate-400 tracking-[0.1em] uppercase">
                                                {item.selections && Object.keys(item.selections).length > 0 ? (
                                                    Object.entries(item.selections).map(([key, val]) => (
                                                        <span key={key} className="flex items-center gap-1">
                                                            {key}:
                                                            {val.startsWith('#') ? (
                                                                <span className="inline-block w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: val }} />
                                                            ) : (
                                                                <span className="text-slate-600">{val}</span>
                                                            )}
                                                            <span className="text-slate-200 mx-1">•</span>
                                                        </span>
                                                    ))
                                                ) : null}
                                                <span>السعر للقطعة: {item.price.toLocaleString()} د.ع</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="inline-flex items-center bg-slate-50/50 border border-slate-100 rounded-2xl p-1 gap-4">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.cartKey, Math.max(1, item.quantity - 1))}
                                                    className="w-8 h-8 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all font-black"
                                                >
                                                    -
                                                </button>
                                                <span className="text-[11px] font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
                                                    className="w-8 h-8 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all font-black"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xl font-black text-indigo-600 tracking-tighter">{(item.price * item.quantity).toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-slate-400">د.ع</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div className="pt-16 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.05)] border border-slate-100/50 space-y-6">
                                <div className="flex items-center justify-between pb-6 border-b border-dashed border-slate-100">
                                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">المجموع الفرعي</span>
                                    <span className="text-lg font-black text-slate-600 tracking-tight">{totalPrice.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter">إجمالي الطلب</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">جميع الضرائب والرسوم مشمولة</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-black text-indigo-600 tracking-tighter leading-none">{totalPrice.toLocaleString()}</span>
                                        <span className="text-xs font-black text-slate-400 uppercase">د.ع</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onContinue}
                                className="w-full h-24 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-slate-950 hover:shadow-indigo-600/10 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-6 group"
                            >
                                <span className="tracking-tight">إتمام عملية الدفع والشحن</span>
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:translate-x-[-8px] transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                            </button>

                            <p className="text-center text-[10px] text-slate-400 font-bold tracking-wide">
                                بالاستمرار في الدفع، أنت توافق على شروط وأحكام {totalPrice > 1000 ? 'الشراء المميز' : 'الاستخدام'}.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
}
