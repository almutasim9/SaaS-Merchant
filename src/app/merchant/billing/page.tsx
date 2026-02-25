'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getStoreSubscriptionAction } from './actions';

interface Plan {
    id: string;
    name_en: string;
    name_ar: string;
    price_monthly: number;
    max_products: number;
    max_categories: number;
    custom_theme: boolean;
    remove_branding: boolean;
    advanced_reports: boolean;
    features_ar?: string[];
}

export default function MerchantBillingPage() {
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
    const [planStartedAt, setPlanStartedAt] = useState<string | null>(null);
    const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchBillingData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: storeData } = await supabase
                .from('stores')
                .select('id')
                .eq('merchant_id', user.id)
                .single();

            if (storeData) {
                const result = await getStoreSubscriptionAction(storeData.id);
                if (result.success) {
                    setCurrentPlan(result.currentPlan);
                    setAllPlans(result.allPlans || []);
                    setPlanExpiresAt(result.planExpiresAt);
                    setPlanStartedAt(result.planStartedAt || null);
                    setSubscriptionType(result.subscriptionType || null);
                } else {
                    console.error('Failed to load subscription data:', result.error);
                }
            }
            setLoading(false);
        };

        fetchBillingData();
    }, [router]);

    const handleUpgradeContact = (planName: string) => {
        const message = encodeURIComponent(`مرحباً، أود الاستفسار عن ترقية باقة متجري إلى باقة ${planName}.`);
        window.open(`https://wa.me/9647703854913?text=${message}`, '_blank');
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-10 pb-10 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tighter">الباقة والاشتراك</h1>
                    <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest">إدارة باقة متجرك ومميزات حسابك.</p>
                </div>
            </div>

            {/* Current Plan Overview */}
            <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 lg:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">باقتك الحالية</h3>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tighter">
                                {currentPlan?.name_ar || subscriptionType || 'غير محدد'}
                            </h2>
                            {(() => {
                                if (!planExpiresAt) return <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">غير محدد</span>;
                                const diff = Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86400000);
                                if (diff < 0) return <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100">⚠️ منتهي</span>;
                                if (diff <= 14) return <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">⏳ ينتهي خلال {diff} يوم</span>;
                                return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">✅ نشط</span>;
                            })()}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {planStartedAt && (
                                <p className="text-xs text-slate-500 font-medium">
                                    بدأ: <span className="text-slate-700 font-bold">{new Date(planStartedAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </p>
                            )}
                            {planExpiresAt && (
                                <p className="text-xs text-slate-500 font-medium">
                                    ينتهي: <span className="text-slate-700 font-bold">{new Date(planExpiresAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </p>
                            )}
                            {!planExpiresAt && (
                                <p className="text-xs text-slate-500 font-medium">لا يوجد تاريخ انتهاء محدد لهذه الباقة.</p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Upgrade Button (Desktop) */}
                <div className="hidden md:block">
                    <button
                        onClick={() => handleUpgradeContact('أخرى')}
                        className="px-6 py-3 bg-slate-900 border border-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        تواصل للدعم المخصص
                    </button>
                </div>
                {/* Upgrade Button (Mobile) */}
                <div className="md:hidden w-full">
                    <button
                        onClick={() => handleUpgradeContact('أخرى')}
                        className="w-full px-6 py-3 bg-slate-900 border border-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        تواصل للدعم المخصص
                    </button>
                </div>
            </div>

            {/* Plans List */}
            <h2 className="text-xl font-bold text-slate-800 mb-6 mt-12 pb-2 border-b border-slate-100">خيارات الترقية والباقات المتاحة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {allPlans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-white rounded-[2rem] border ${currentPlan?.id === plan.id ? 'border-indigo-500 shadow-indigo-500/10 ring-4 ring-indigo-50' : 'border-slate-100 shadow-sm'} p-8 flex flex-col relative transition-all duration-300 hover:shadow-lg`}
                    >
                        {currentPlan?.id === plan.id && (
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                الباقة الحالية
                            </div>
                        )}
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 mb-2">{plan.name_ar}</h3>
                            <div className="flex items-end justify-center gap-1">
                                <span className="text-4xl font-black text-slate-900">{plan.price_monthly}</span>
                                <span className="text-sm font-bold text-slate-400 mb-1">د.ع / شهرياً</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features_ar?.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-sm font-bold text-slate-600 leading-relaxed">
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgradeContact(plan.name_ar)}
                            disabled={currentPlan?.id === plan.id}
                            className={`w-full py-4 rounded-xl font-bold transition-all text-sm ${currentPlan?.id === plan.id
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95'
                                }`}
                        >
                            {currentPlan?.id === plan.id ? 'الباقة الحالية' : 'اطلب الترقية الآن'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4 text-blue-800">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm font-medium">
                    <p className="font-bold mb-1 border-b border-blue-200/50 pb-1 inline-block">ترقية الباقات متوفرة يدوياً في الوقت الحالي</p>
                    <p>لترقية باقتك وتفعيل المزيد من المميزات لبناء متجرك الإلكتروني، يرجى النقر على زر "اطلب الترقية الآن" للتواصل مباشرة مع فريق الدعم والمبيعات لدينا عبر الواتساب. سيتم تفعيل الباقة فور التواصل وتحويل المبلغ.</p>
                </div>
            </div>
        </div>
    );
}
