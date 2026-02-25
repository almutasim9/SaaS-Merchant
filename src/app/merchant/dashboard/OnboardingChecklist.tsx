'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OnboardingChecklistProps {
    storeSlug: string;
    hasProducts: boolean;
    hasSections: boolean;
    storeConfigured: boolean;
}

const STORAGE_KEY = 'onboarding_dismissed';

export default function OnboardingChecklist({ storeSlug, hasProducts, hasSections, storeConfigured }: OnboardingChecklistProps) {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
        setDismissed(isDismissed);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setDismissed(true);
    };

    const steps = [
        {
            id: 'store',
            label: 'تم إنشاء متجرك بنجاح',
            done: true,
            href: null,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            id: 'sections',
            label: 'أضف أول قسم للمنتجات',
            done: hasSections,
            href: '/merchant/sections',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            )
        },
        {
            id: 'products',
            label: 'أضف أول منتج للبيع',
            done: hasProducts,
            href: '/merchant/products',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            id: 'settings',
            label: 'خصّص ألوان وهوية متجرك',
            done: storeConfigured,
            href: '/merchant/settings',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            )
        },
        {
            id: 'share',
            label: 'شارك رابط متجرك',
            done: false,
            href: null,
            isShare: true,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            )
        }
    ];

    const completedCount = steps.filter(s => s.done).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const allDone = completedCount === steps.length;

    if (dismissed || (allDone && hasProducts)) return null;

    const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${storeSlug}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(storeUrl);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-5 relative overflow-hidden">
            {/* Dismiss */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-black text-slate-800 text-base">ابدأ رحلتك مع المتجر! 🚀</h3>
                    <p className="text-xs text-slate-500 font-medium">{completedCount} من {steps.length} خطوات مكتملة</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-5">
                <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
                {steps.map(step => (
                    <div key={step.id}>
                        {(step as any).isShare ? (
                            <div className={`flex items-center gap-3 p-3 rounded-2xl ${step.done ? 'bg-emerald-50' : 'bg-white/70'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step.icon}
                                </div>
                                <span className={`flex-1 text-sm font-bold ${step.done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                                    {step.label}
                                </span>
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
                                >
                                    نسخ الرابط
                                </button>
                            </div>
                        ) : step.href ? (
                            <Link href={step.href} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${step.done ? 'bg-emerald-50' : 'bg-white/70 hover:bg-white hover:shadow-sm'
                                }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step.done ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : step.icon}
                                </div>
                                <span className={`flex-1 text-sm font-bold ${step.done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                                    {step.label}
                                </span>
                                {!step.done && (
                                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                )}
                            </Link>
                        ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-2xl ${step.done ? 'bg-emerald-50' : 'bg-white/70'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step.done ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : step.icon}
                                </div>
                                <span className={`text-sm font-bold ${step.done ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                                    {step.label}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
