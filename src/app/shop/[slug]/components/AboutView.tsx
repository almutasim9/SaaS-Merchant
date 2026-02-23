'use client';

import React from 'react';

interface AboutViewProps {
    onBack: () => void;
    storeName: string;
    storeDescription?: string;
    storeLogo?: string;
    aboutContent?: string;
}

export default function AboutView({ onBack, storeName, storeDescription, aboutContent }: AboutViewProps) {
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
                    <h1 className="text-lg font-bold text-slate-800">من نحن</h1>
                    <div className="w-10" />
                </div>
            </header>

            {/* Hero */}
            <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-[200px] flex items-end shadow-sm" style={{ background: 'linear-gradient(to bottom left, color-mix(in srgb, var(--theme-primary) 85%, black), var(--theme-primary))' }}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 p-6">
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2">
                        قصتنا
                    </span>
                    <h2 className="text-white text-2xl font-bold leading-tight">
                        نبني المستقبل<br />لتجربة تسوق أفضل
                    </h2>
                </div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/10" />
            </div>

            {/* Welcome Text */}
            <div className="px-5 pt-8 pb-6 text-right">
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                    أهلاً بكم في <span style={{ color: 'var(--theme-primary)' }}>{storeName}</span>
                </h3>
                <p className="text-sm text-slate-500 leading-7">
                    {aboutContent || storeDescription || `نحن متجر إلكتروني رائد نسعى لتقديم أفضل المنتجات التي تلبي احتياجاتكم اليومية بجودة عالية وأسعار منافسة. تأسس متجرنا برؤية واضحة تهدف إلى تسهيل تجربة التسوق الرقمي وجعلها أكثر متعة وسهولة.`}
                </p>
            </div>

            {/* Values */}
            <div className="px-5 pb-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span style={{ color: 'var(--theme-primary)' }}>|</span>
                    قيمنا ومبادئنا
                </h3>
                <div className="space-y-3">
                    {/* Quality */}
                    <div className="bg-[#F8F9FB] rounded-xl p-4 text-right">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-[#E8FFF4] flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#00D084]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-slate-800">جودة لا تضاهى</h4>
                        </div>
                        <p className="text-sm text-slate-500 leading-6 mr-12">
                            نضمن لكم أفضل الخامات وأدق التفاصيل في جميع منتجاتنا المختارة بعناية فائقة.
                        </p>
                    </div>

                    {/* Shipping */}
                    <div className="bg-[#F8F9FB] rounded-xl p-4 text-right">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-[#E8F4FF] flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-slate-800">شحن فوري وآمن</h4>
                        </div>
                        <p className="text-sm text-slate-500 leading-6 mr-12">
                            توصيل آمن وسريع خلال أيام معدودة لجميع المناطق مع تتبع مباشر.
                        </p>
                    </div>

                    {/* Support */}
                    <div className="bg-[#F8F9FB] rounded-xl p-4 text-right">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-[#FFF4E8] flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-slate-800">دعم متواصل 24/7</h4>
                        </div>
                        <p className="text-sm text-slate-500 leading-6 mr-12">
                            فريق خدمة العملاء جاهز لخدمتكم والإجابة على استفساراتكم في أي وقت.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mx-5 mb-6 bg-[#F8F9FB] rounded-2xl p-4 flex items-center justify-around text-center">
                <div>
                    <p className="text-lg font-bold text-slate-800">50k+</p>
                    <p className="text-[11px] text-slate-400">عميل سعيد</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                    <p className="text-lg font-bold text-slate-800">1200+</p>
                    <p className="text-[11px] text-slate-400">منتج أصلي</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                    <p className="text-lg font-bold text-slate-800">24/7</p>
                    <p className="text-[11px] text-slate-400">دعم فني</p>
                </div>
            </div>

            {/* Back Button */}
            <div className="px-5 pb-8">
                <button
                    onClick={onBack}
                    className="w-full py-3.5 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:brightness-95"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    العودة للرئيسية
                </button>
            </div>
        </div>
    );
}
