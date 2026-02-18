'use client';

import React, { useState } from 'react';

interface CheckoutViewProps {
    totalPrice: number;
    onBack: () => void;
    onPlaceOrder: (info: any) => void;
    isOrdering: boolean;
}

export default function CheckoutView({ totalPrice, onBack, onPlaceOrder, isOrdering }: CheckoutViewProps) {
    const [info, setInfo] = useState({
        name: '',
        phone: '',
        city: '',
        landmark: '',
        notes: ''
    });

    const cities = ['بغداد', 'أربيل', 'البصرة', 'الموصل', 'السليمانية', 'دهوك', 'كركوك', 'النجف', 'كربلاء'];

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-right pb-40 animate-in slide-in-from-right duration-500" dir="rtl">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white px-6 py-6 flex items-center justify-between shadow-sm">
                <h3 className="text-xl font-bold text-slate-800">إتمام الطلب</h3>
                <button onClick={onBack} className="p-2 transition-transform active:scale-90">
                    <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </header>

            {/* Stepper Mock */}
            <div className="px-10 py-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-100 -z-10 -translate-y-1/2"></div>
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="w-10 h-10 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span className="text-emerald-500">السلة</span>
                    <span className="text-emerald-500">الشحن</span>
                    <span>تأكيد</span>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onPlaceOrder(info); }} className="px-6 space-y-8">
                {/* Recipient info */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">معلومات المستلم</h4>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-800 mb-2">اسم الشخص</label>
                            <input
                                required
                                type="text"
                                placeholder="أدخل اسمك الكامل"
                                value={info.name}
                                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right"
                            />
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-[42px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-800 mb-2">رقم الهاتف</label>
                            <input
                                required
                                type="tel"
                                placeholder="05xxxxxxxx"
                                value={info.phone}
                                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right placeholder:opacity-30"
                            />
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-[42px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Address Details */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تفاصيل العنوان</h4>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-800 mb-2">المدينة</label>
                            <select
                                required
                                value={info.city}
                                onChange={(e) => setInfo({ ...info, city: e.target.value })}
                                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right appearance-none"
                            >
                                <option value="">اختر المدينة</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-[42px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <svg className="w-4 h-4 text-slate-300 absolute left-4 top-[42px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-800 mb-2">أقرب نقطة دالة</label>
                            <input
                                type="text"
                                placeholder="مثلاً: بجانب المسجد الكبير"
                                value={info.landmark}
                                onChange={(e) => setInfo({ ...info, landmark: e.target.value })}
                                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right"
                            />
                            <svg className="w-5 h-5 text-slate-300 absolute right-4 top-[42px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ملاحظات إضافية</h4>
                    <textarea
                        placeholder="أي تعليمات خاصة للتوصيل..."
                        value={info.notes}
                        onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                        rows={4}
                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right resize-none"
                    ></textarea>
                </div>

                {/* Simple Summary */}
                <div className="bg-emerald-50 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">سعر المنتجات</span>
                        <span className="text-sm font-bold text-slate-800">{totalPrice.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">رسوم التوصيل</span>
                        <span className="text-sm font-bold text-emerald-500">مجاني</span>
                    </div>
                </div>

                {/* Bottom Sticky Action */}
                <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 safe-area-bottom">
                    <div className="flex items-center justify-end mb-4 px-2">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block leading-none">إجمالي المبلغ</span>
                            <span className="text-2xl font-bold text-slate-800 tracking-tighter">{totalPrice.toFixed(2)} ر.س</span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isOrdering}
                        className="w-full bg-[#00D084] text-white py-5 rounded-[2.5rem] font-bold text-sm shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isOrdering ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                اتمام الطلب
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
