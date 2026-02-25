'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { registerMerchantAction } from './actions';

const DURATION_OPTIONS = [
    { value: '3', label: '3 أشهر' },
    { value: '6', label: '6 أشهر' },
    { value: '12', label: 'سنة كاملة' },
];

function calcExpiry(startDate: string, months: number): string {
    if (!startDate) return '—';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AddMerchantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        storeName: '',
        slug: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        category: 'Restaurants',
        subscriptionType: 'Free',
        subscriptionDuration: '12',
        planStartDate: today,
    });

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            router.push('/login');
        } else {
            setIsAdmin(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'storeName') {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, storeName: value, slug: generatedSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDurationSelect = (months: string) => {
        setFormData(prev => ({ ...prev, subscriptionDuration: months }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await registerMerchantAction(formData);
            if (!result.success) throw new Error(result.error);
            setSuccess(true);
            setTimeout(() => router.push('/admin/dashboard'), 2000);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return null;

    const expiryPreview = calcExpiry(formData.planStartDate, parseInt(formData.subscriptionDuration));

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-100" dir="rtl">
            <div className="w-full max-w-2xl">
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-200"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">إضافة تاجر جديد</h1>
                        <p className="text-slate-500">قم بتعبئة البيانات لإنشاء متجر وحساب جديد للتاجر.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">

                        {/* ─── Store Information ─── */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">بيانات المتجر</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">اسم المتجر</label>
                                    <input
                                        type="text" name="storeName" required
                                        value={formData.storeName} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="مطعم السعادة"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">الرابط الفرعي (Slug)</label>
                                    <input
                                        type="text" name="slug" required
                                        value={formData.slug} onChange={handleInputChange}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 focus:outline-none cursor-not-allowed font-mono text-sm"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">التصنيف</label>
                                <select
                                    name="category" value={formData.category} onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                >
                                    <option>Restaurants</option>
                                    <option>Electronics</option>
                                    <option>Clothing</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        {/* ─── Subscription ─── */}
                        <div className="space-y-6 pt-2">
                            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">الاشتراك والدفع</h3>

                            {/* Plan Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">الباقة</label>
                                <select
                                    name="subscriptionType" value={formData.subscriptionType} onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                >
                                    <option value="Free">مجاني (Free)</option>
                                    <option value="Silver">احترافي (Silver)</option>
                                    <option value="Gold">متميز (Gold)</option>
                                </select>
                            </div>

                            {/* Duration Pills */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">مدة الاشتراك</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {DURATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleDurationSelect(opt.value)}
                                            className={`py-3 rounded-2xl text-sm font-bold transition-all border-2 ${formData.subscriptionDuration === opt.value
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100'
                                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Date + Expiry */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">تاريخ بداية الاشتراك</label>
                                    <input
                                        type="date" name="planStartDate"
                                        value={formData.planStartDate} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">تاريخ الانتهاء (تلقائي)</label>
                                    <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-emerald-700 font-bold text-sm">{expiryPreview}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── Owner Info ─── */}
                        <div className="space-y-6 pt-2">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">بيانات المالك والحساب</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">اسم المالك</label>
                                    <input
                                        type="text" name="ownerName" required
                                        value={formData.ownerName} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="محمد علي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">رقم الهاتف</label>
                                    <input
                                        type="tel" name="phone" required
                                        value={formData.phone} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="+964..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">البريد الإلكتروني</label>
                                    <input
                                        type="email" name="email" required
                                        value={formData.email} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="merchant@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">كلمة المرور</label>
                                    <input
                                        type="password" name="password" required
                                        value={formData.password} onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm p-4 rounded-2xl flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-4 rounded-2xl flex items-center gap-3">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                تم تسجيل التاجر بنجاح! جاري التحويل...
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>إتمام التسجيل</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
