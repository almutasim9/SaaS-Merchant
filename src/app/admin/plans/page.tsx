'use client';

import { useState, useEffect } from 'react';
import { fetchPlansAction, updatePlanAction, SubscriptionPlan } from './actions';
import { toast } from 'sonner';

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [activeSection, setActiveSection] = useState<'limits' | 'features' | 'text'>('limits');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        const result = await fetchPlansAction();
        if (result.success && result.data) {
            setPlans(result.data);
        } else {
            toast.error(result.error || 'فشل في جلب الباقات');
        }
        setLoading(false);
    };

    const handleUpdateChange = (planId: string, field: keyof SubscriptionPlan, value: any) => {
        setPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, [field]: value } : p
        ));
    };

    const handleFeaturesChange = (planId: string, lang: 'ar' | 'en' | 'ku', value: string) => {
        setPlans(prev => prev.map(p =>
            p.id === planId ? { ...p, [`features_${lang}`]: value.split('\n').map(l => l.trim()).filter(Boolean) } : p
        ));
    };

    const handleSavePlan = async (plan: SubscriptionPlan) => {
        setSavingId(plan.id);
        const result = await updatePlanAction(plan.id, {
            name_en: plan.name_en,
            price_monthly: plan.price_monthly,
            max_products: plan.max_products,
            max_categories: plan.max_categories,
            max_delivery_zones: plan.max_delivery_zones,
            max_monthly_orders: plan.max_monthly_orders,
            custom_theme: plan.custom_theme,
            remove_branding: plan.remove_branding,
            advanced_reports: plan.advanced_reports,
            free_delivery_all_zones: plan.free_delivery_all_zones,
            allow_custom_slug: plan.allow_custom_slug,
            allow_variants: plan.allow_variants,
            allow_excel_import: plan.allow_excel_import,
            allow_social_links: plan.allow_social_links,
            allow_banner: plan.allow_banner,
            allow_thermal_printing: plan.allow_thermal_printing,
            price_yearly: plan.price_yearly || 0,
            yearly_discount_percent: plan.yearly_discount_percent || 0,
            description_ar: plan.description_ar || '',
            description_en: plan.description_en || '',
            description_ku: plan.description_ku || '',
            features_ar: plan.features_ar || [],
            features_en: plan.features_en || [],
            features_ku: plan.features_ku || []
        });

        if (result.success) {
            toast.success(`تم حفظ إعدادات باقة ${plan.name_ar} بنجاح ✅`);
        } else {
            toast.error(result.error || 'فشل في حفظ الباقة');
        }
        setSavingId(null);
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const plan = plans[activeTab];
    if (!plan) return null;

    const tabColors: Record<string, { bg: string; border: string; text: string; ring: string; badge: string }> = {
        'free': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-500', badge: 'bg-emerald-500' },
        'silver': { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', ring: 'ring-slate-500', badge: 'bg-slate-500' },
        'gold': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-500', badge: 'bg-amber-500' },
    };

    const getColor = (id: string) => tabColors[id.toLowerCase()] || tabColors['free'];

    const toggleFeatures: { key: keyof SubscriptionPlan; label: string; icon: string; activeColor: string; checkColor: string }[] = [
        { key: 'custom_theme', label: 'تخصيص كامل للواجهة', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', activeColor: 'bg-emerald-100 text-emerald-600', checkColor: 'peer-checked:bg-emerald-500' },
        { key: 'remove_branding', label: 'إزالة حقوق المنصة', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', activeColor: 'bg-indigo-100 text-indigo-600', checkColor: 'peer-checked:bg-indigo-500' },
        { key: 'advanced_reports', label: 'تقارير مبيعات متقدمة', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', activeColor: 'bg-amber-100 text-amber-600', checkColor: 'peer-checked:bg-amber-500' },
        { key: 'free_delivery_all_zones', label: 'توصيل مجاني لكل المناطق', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', activeColor: 'bg-sky-100 text-sky-600', checkColor: 'peer-checked:bg-sky-500' },
        { key: 'allow_custom_slug', label: 'تغيير رابط المتجر (Slug)', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101', activeColor: 'bg-orange-100 text-orange-600', checkColor: 'peer-checked:bg-orange-500' },
        { key: 'allow_variants', label: 'متغيرات المنتجات (Variants)', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', activeColor: 'bg-violet-100 text-violet-600', checkColor: 'peer-checked:bg-violet-500' },
        { key: 'allow_excel_import', label: 'استيراد من Excel', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', activeColor: 'bg-green-100 text-green-600', checkColor: 'peer-checked:bg-green-500' },
        { key: 'allow_social_links', label: 'روابط التواصل الاجتماعي', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', activeColor: 'bg-pink-100 text-pink-600', checkColor: 'peer-checked:bg-pink-500' },
        { key: 'allow_banner', label: 'البانر الترويجي', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', activeColor: 'bg-cyan-100 text-cyan-600', checkColor: 'peer-checked:bg-cyan-500' },
        { key: 'allow_thermal_printing', label: 'طباعة فواتير حرارية (80mm)', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z', activeColor: 'bg-zinc-100 text-zinc-600', checkColor: 'peer-checked:bg-zinc-500' },
        { key: 'allow_category_images', label: 'رفع صور للأقسام (Categories)', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', activeColor: 'bg-teal-100 text-teal-600', checkColor: 'peer-checked:bg-teal-500' },
        { key: 'allow_multiple_product_images', label: 'رفع أكثر من صورة للمنتج', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', activeColor: 'bg-rose-100 text-rose-600', checkColor: 'peer-checked:bg-rose-500' },
        { key: 'allow_about_page', label: 'صفحة "من نحن"', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', activeColor: 'bg-fuchsia-100 text-fuchsia-600', checkColor: 'peer-checked:bg-fuchsia-500' },
        { key: 'allow_order_reception_options', label: 'تخصيص خيارات استقبال الطلبات', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', activeColor: 'bg-blue-100 text-blue-600', checkColor: 'peer-checked:bg-blue-500' },
    ];

    return (
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">إدارة الباقات والاشتراكات</h1>
                    <p className="text-slate-500 mt-1 font-medium text-sm">تحكم في القيود والميزات المتاحة لكل باقة في المنصة</p>
                </div>

                {/* Plan Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    {plans.map((p, i) => {
                        const c = getColor(p.id);
                        const isActive = i === activeTab;
                        return (
                            <button
                                key={p.id}
                                onClick={() => { setActiveTab(i); setActiveSection('limits'); }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${isActive
                                    ? `bg-white shadow-md ${c.text}`
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <span className="block text-lg">{p.name_ar}</span>
                                <span className="block text-[10px] uppercase tracking-widest opacity-70 mt-0.5">{p.name_en}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Plan Card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    {/* Section Tabs */}
                    <div className="border-b border-slate-100 flex">
                        {[
                            { id: 'limits' as const, label: 'القيود والحدود', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                            { id: 'features' as const, label: 'الميزات', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                            { id: 'text' as const, label: 'النصوص والوصف', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeSection === tab.id
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Section Content */}
                    <div className="p-6 lg:p-8">
                        {/* ═══ Limits Section ═══ */}
                        {activeSection === 'limits' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                {[
                                    { field: 'max_products' as const, label: 'الحد الأقصى للمنتجات', hint: '-1 = مفتوح' },
                                    { field: 'max_categories' as const, label: 'الحد الأقصى للأقسام', hint: '-1 = مفتوح' },
                                    { field: 'max_monthly_orders' as const, label: 'الحد الأقصى للطلبات الشهرية', hint: '-1 = مفتوح' },
                                    { field: 'max_delivery_zones' as const, label: 'الحد الأقصى لمناطق التوصيل', hint: '-1 = مفتوح' },
                                    { field: 'price_monthly' as const, label: 'السعر الشهري', hint: 'بالدولار أو الدينار' },
                                    { field: 'price_yearly' as const, label: 'السعر السنوي', hint: '' },
                                    { field: 'yearly_discount_percent' as const, label: 'نسبة الخصم السنوي (%)', hint: 'للواجهة فقط' },
                                ].map(item => (
                                    <div key={item.field} className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">{item.label}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(plan as any)[item.field] ?? 0}
                                                onChange={(e) => handleUpdateChange(plan.id, item.field, parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                dir="ltr"
                                            />
                                            {item.hint && (
                                                <span className="text-[10px] text-slate-400 w-20 text-center font-medium">{item.hint}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ═══ Features Section ═══ */}
                        {activeSection === 'features' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {toggleFeatures.map(feat => (
                                    <label key={feat.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${(plan as any)[feat.key] ? feat.activeColor : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{feat.label}</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors">
                                            <input type="checkbox" className="sr-only peer" checked={(plan as any)[feat.key] ?? false} onChange={(e) => handleUpdateChange(plan.id, feat.key, e.target.checked)} />
                                            <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${feat.checkColor}`}></div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* ═══ Text Section ═══ */}
                        {activeSection === 'text' && (
                            <div className="space-y-6">
                                {/* Descriptions */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">شرح الباقة</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">عربي</label>
                                            <input type="text" value={plan.description_ar || ''} onChange={(e) => handleUpdateChange(plan.id, 'description_ar', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="شرح مختصر..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">English</label>
                                            <input type="text" value={plan.description_en || ''} onChange={(e) => handleUpdateChange(plan.id, 'description_en', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black text-left focus:ring-2 focus:ring-indigo-500 transition-all" dir="ltr" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">کوردی</label>
                                            <input type="text" value={plan.description_ku || ''} onChange={(e) => handleUpdateChange(plan.id, 'description_ku', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:ring-2 focus:ring-indigo-500 transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Features Lists */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ميزات الباقة المكتوبة</h4>
                                    <p className="text-[10px] text-slate-400 font-medium mb-4">اكتب كل ميزة في سطر جديد لكي تظهر في صفحة الباقات.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">ميزات (عربي)</label>
                                            <textarea rows={5} value={(plan.features_ar || []).join('\n')} onChange={(e) => handleFeaturesChange(plan.id, 'ar', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black resize-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder={"ميزة 1\nميزة 2"} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">Features (English)</label>
                                            <textarea rows={5} value={(plan.features_en || []).join('\n')} onChange={(e) => handleFeaturesChange(plan.id, 'en', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black resize-none text-left focus:ring-2 focus:ring-indigo-500 transition-all" dir="ltr" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600">تایبەتمەندییەکان (کوردی)</label>
                                            <textarea rows={5} value={(plan.features_ku || []).join('\n')} onChange={(e) => handleFeaturesChange(plan.id, 'ku', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black resize-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">تعديل: {plan.name_ar} ({plan.name_en})</span>
                        <button
                            onClick={() => handleSavePlan(plan)}
                            disabled={savingId === plan.id}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
                        >
                            {savingId === plan.id ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    حفظ التعديلات
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
