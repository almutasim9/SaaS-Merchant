'use client';

import { useState, useEffect } from 'react';
import { fetchPlansAction, updatePlanAction, SubscriptionPlan } from './actions';
import { toast } from 'react-hot-toast';

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

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

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الباقات والاشتراكات</h1>
                    <p className="text-slate-500 mt-2 font-medium">تحكم في القيود والميزات المتاحة لكل باقة في المنصة</p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            {/* Plan Header */}
                            <div className={`p-6 border-b ${plan.id === 'gold' ? 'bg-amber-50 border-amber-100' :
                                plan.id === 'silver' ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-100'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-black text-slate-800">{plan.name_ar}</h2>
                                    <span className="text-xs font-bold px-3 py-1 bg-white rounded-full shadow-sm text-slate-600 uppercase tracking-wider">
                                        {plan.id}
                                    </span>
                                </div>
                            </div>

                            {/* Plan Settings */}
                            <div className="p-6 space-y-6 flex-1">
                                {/* Limits */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">القيود (Limits)</h3>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">الحد الأقصى للمنتجات</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.max_products}
                                                onChange={(e) => handleUpdateChange(plan.id, 'max_products', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                            <span className="text-xs text-slate-500 w-24 text-center bg-slate-100 py-2.5 rounded-xl font-medium">(-1 مفتوح)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">الحد الأقصى للأقسام</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.max_categories}
                                                onChange={(e) => handleUpdateChange(plan.id, 'max_categories', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                            <span className="text-xs text-slate-500 w-24 text-center bg-slate-100 py-2.5 rounded-xl font-medium">(-1 مفتوح)</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">السعر الشهري</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.price_monthly}
                                                onChange={(e) => handleUpdateChange(plan.id, 'price_monthly', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">السعر السنوي</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.price_yearly || 0}
                                                onChange={(e) => handleUpdateChange(plan.id, 'price_yearly', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">نسبة الخصم السنوي (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.yearly_discount_percent || 0}
                                                onChange={(e) => handleUpdateChange(plan.id, 'yearly_discount_percent', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                                max={100}
                                                min={0}
                                            />
                                            <span className="text-xs text-slate-500 w-24 text-center bg-slate-100 py-2.5 rounded-xl font-medium">للواجهة فقط</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">الحد الأقصى للطلبات الشهرية</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.max_monthly_orders}
                                                onChange={(e) => handleUpdateChange(plan.id, 'max_monthly_orders', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                            <span className="text-xs text-slate-500 w-24 text-center bg-slate-100 py-2.5 rounded-xl font-medium">(-1 مفتوح)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">الحد الأقصى لمناطق التوصيل</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={plan.max_delivery_zones}
                                                onChange={(e) => handleUpdateChange(plan.id, 'max_delivery_zones', parseInt(e.target.value) || 0)}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-center"
                                                dir="ltr"
                                            />
                                            <span className="text-xs text-slate-500 w-24 text-center bg-slate-100 py-2.5 rounded-xl font-medium">(-1 مفتوح)</span>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Descriptions & Features Lists */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">نص الباقة (Descriptions)</h3>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">شرح الباقة (عربي)</label>
                                        <input
                                            type="text"
                                            value={plan.description_ar || ''}
                                            onChange={(e) => handleUpdateChange(plan.id, 'description_ar', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black"
                                            placeholder="شرح مختصر يظهر تحت اسم الباقة"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">شرح الباقة (انكليزي)</label>
                                        <input
                                            type="text"
                                            value={plan.description_en || ''}
                                            onChange={(e) => handleUpdateChange(plan.id, 'description_en', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">شرح الباقة (كردي)</label>
                                        <input
                                            type="text"
                                            value={plan.description_ku || ''}
                                            onChange={(e) => handleUpdateChange(plan.id, 'description_ku', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">الميزات المكتوبة (Landing Page Features)</h3>
                                    <p className="text-[10px] text-slate-500 font-bold px-1">اكتب كل ميزة في سطر جديد لكي تظهر في صفحة الباقات.</p>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">ميزات الباقة (عربي)</label>
                                        <textarea
                                            rows={4}
                                            value={(plan.features_ar || []).join('\n')}
                                            onChange={(e) => handleFeaturesChange(plan.id, 'ar', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black resize-none"
                                            placeholder="ميزة 1&#10;ميزة 2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">ميزات الباقة (انكليزي)</label>
                                        <textarea
                                            rows={2}
                                            value={(plan.features_en || []).join('\n')}
                                            onChange={(e) => handleFeaturesChange(plan.id, 'en', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black resize-none text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">ميزات الباقة (كردي)</label>
                                        <textarea
                                            rows={2}
                                            value={(plan.features_ku || []).join('\n')}
                                            onChange={(e) => handleFeaturesChange(plan.id, 'ku', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black resize-none"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Plan System Toggles Features */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">الميزات (Features)</h3>

                                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${plan.custom_theme ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">تخصيص كامل للواجهة</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                            <input type="checkbox" className="sr-only peer" checked={plan.custom_theme} onChange={(e) => handleUpdateChange(plan.id, 'custom_theme', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${plan.remove_branding ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">إزالة حقوق المنصة</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                            <input type="checkbox" className="sr-only peer" checked={plan.remove_branding} onChange={(e) => handleUpdateChange(plan.id, 'remove_branding', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${plan.advanced_reports ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">تقارير مبيعات متقدمة</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                            <input type="checkbox" className="sr-only peer" checked={plan.advanced_reports} onChange={(e) => handleUpdateChange(plan.id, 'advanced_reports', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${plan.free_delivery_all_zones ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">توصيل مجاني لكل المناطق</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                            <input type="checkbox" className="sr-only peer" checked={plan.free_delivery_all_zones} onChange={(e) => handleUpdateChange(plan.id, 'free_delivery_all_zones', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${plan.allow_custom_slug ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">تغيير رابط المتجر (Slug)</span>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                            <input type="checkbox" className="sr-only peer" checked={plan.allow_custom_slug} onChange={(e) => handleUpdateChange(plan.id, 'allow_custom_slug', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={() => handleSavePlan(plan)}
                                    disabled={savingId === plan.id}
                                    className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all"
                                >
                                    {savingId === plan.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>حفظ التعديلات</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
