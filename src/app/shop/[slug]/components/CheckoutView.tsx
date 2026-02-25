'use client';

import React, { useState } from 'react';

interface CheckoutViewProps {
    totalPrice: number;
    onBack: () => void;
    onPlaceOrder: (info: any) => void;
    isOrdering: boolean;
    deliveryFees?: any;
}

const IRAQ_CITIES = ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'السليمانية', 'دهوك', 'كركوك', 'النجف', 'كربلاء', 'الحلة', 'الأنبار', 'الديوانية', 'الكوت', 'العمارة', 'الناصرية', 'السماوة', 'ديالى', 'صلاح الدين'];

const normalizeNumbers = (str: string) => {
    if (!str) return '';
    return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

export default function CheckoutView({ totalPrice, onBack, onPlaceOrder, isOrdering, deliveryFees }: CheckoutViewProps) {
    const [info, setInfo] = useState({
        name: '',
        phone: '',
        city: '',
        landmark: '',
        notes: ''
    });

    // Process delivery fees
    let processedFees: Record<string, { fee: number, enabled: boolean }> = {};
    const isFreeDelivery = deliveryFees?.isFreeDelivery === true;
    if (deliveryFees && typeof deliveryFees.baghdad === 'number') {
        IRAQ_CITIES.forEach(city => {
            processedFees[city] = { fee: city === 'بغداد' ? deliveryFees.baghdad : (deliveryFees.provinces || 8000), enabled: true };
        });
    } else if (deliveryFees && typeof deliveryFees === 'object' && Object.keys(deliveryFees).length > 0) {
        processedFees = deliveryFees;
    } else {
        IRAQ_CITIES.forEach(city => {
            processedFees[city] = { fee: city === 'بغداد' ? 5000 : 8000, enabled: true };
        });
    }

    const availableCities = IRAQ_CITIES.filter(city => processedFees[city]?.enabled !== false);

    React.useEffect(() => {
        if (info.city && !availableCities.includes(info.city)) {
            setInfo(prev => ({ ...prev, city: '' }));
        }
    }, [availableCities.length]);

    const deliveryFee = !info.city ? 0 : (isFreeDelivery ? 0 : (processedFees[info.city]?.fee || 0));
    const finalTotal = totalPrice + deliveryFee;

    const isPhoneValid = info.phone.startsWith('07') && info.phone.length === 11;
    const isValid = !!(info.name.trim() && isPhoneValid && info.city && info.landmark.trim());

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
                    <h1 className="text-lg font-bold text-slate-800">بيانات الشحن</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Step Indicator */}
            <div className="px-10 py-6">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-slate-200 -z-10" />
                    <div className="absolute top-5 left-[50%] right-[15%] h-0.5 bg-[var(--theme-primary)] -z-10" />

                    {/* Step 3: الدفع */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center bg-white text-sm font-bold">
                            3
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">الدفع</span>
                    </div>

                    {/* Step 2: الشحن (active) */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 bg-[var(--theme-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ">
                            2
                        </div>
                        <span className="text-[11px] text-[var(--theme-primary)] font-bold">الشحن</span>
                    </div>

                    {/* Step 1: السلة (done) */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 bg-[var(--theme-primary)] text-white rounded-full flex items-center justify-center shadow-lg ">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[11px] text-[var(--theme-primary)] font-bold">السلة</span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); if (isValid) onPlaceOrder(info); }} className="px-5 pb-48">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">عنوان التوصيل</h2>
                    <p className="text-sm text-slate-400 mt-1">أين يجب أن نرسل طلبك؟</p>
                </div>

                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="أدخل اسمك الثلاثي"
                                value={info.name}
                                onChange={e => setInfo({ ...info, name: e.target.value })}
                                className="w-full h-12 pr-11 pl-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-[var(--theme-primary)] transition-all text-right"
                                required
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم الجوال</label>
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="07xxxxxxxxx"
                                value={info.phone}
                                maxLength={11}
                                onChange={e => {
                                    // Normalize eastern arabic, strip non-digits, and restrict to 11 chars
                                    const val = normalizeNumbers(e.target.value).replace(/\D/g, '').slice(0, 11);
                                    setInfo({ ...info, phone: val });
                                }}
                                className={`w-full h-12 pr-11 pl-4 bg-slate-50 rounded-xl border ${info.phone && (!info.phone.startsWith('07') || info.phone.length !== 11) ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-200 focus:ring-slate-200 focus:border-[var(--theme-primary)]'} text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all text-right`}
                                dir="ltr"
                                required
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                            </div>
                        </div>
                        {info.phone && (!info.phone.startsWith('07') || info.phone.length !== 11) && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1">يجب أن يبدأ رقم الهاتف بـ 07 ويتكون من 11 رقماً.</p>
                        )}
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">المدينة</label>
                        <div className="relative">
                            <select
                                value={info.city}
                                onChange={e => setInfo({ ...info, city: e.target.value })}
                                className="w-full h-12 pr-11 pl-8 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-[var(--theme-primary)] transition-all text-right appearance-none"
                                required
                            >
                                <option value="">اختر مدينتك</option>
                                {availableCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                </svg>
                            </div>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل العنوان/الحي</label>
                        <textarea
                            placeholder="اسم الحي، اسم الشارع، رقم المنزل..."
                            value={info.landmark}
                            onChange={e => setInfo({ ...info, landmark: normalizeNumbers(e.target.value) })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-[var(--theme-primary)] transition-all text-right resize-none"
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات (اختياري)</label>
                        <input
                            type="text"
                            placeholder="ملاحظات إضافية للتوصيل..."
                            value={info.notes}
                            onChange={e => setInfo({ ...info, notes: e.target.value })}
                            className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-[var(--theme-primary)] transition-all text-right"
                        />
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">المجموع الفرعي</span>
                        <span className="text-sm font-bold text-slate-700">{totalPrice.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">سعر التوصيل</span>
                        <span className="text-sm font-bold text-[var(--theme-primary)]">
                            {isFreeDelivery ? 'مجاني' : info.city ? `${deliveryFee.toLocaleString()} د.ع` : 'اختر المدينة'}
                        </span>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-base font-bold text-slate-800">المجموع الكامل</span>
                        <span className="text-xl font-black text-slate-800">{finalTotal.toLocaleString()} د.ع</span>
                    </div>
                </div>
            </form>

            {/* Fixed Bottom */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-5 py-4 z-50 safe-area-bottom">
                <button
                    onClick={() => { if (isValid) onPlaceOrder(info); }}
                    disabled={!isValid || isOrdering}
                    className={`w-full h-13 py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${!isValid || isOrdering
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[var(--theme-primary)] text-white shadow-lg  hover:brightness-110 active:scale-[0.98]'
                        }`}
                >
                    {isOrdering ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            جاري إرسال الطلب...
                        </>
                    ) : (
                        <>
                            تأكيد وطلب
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
