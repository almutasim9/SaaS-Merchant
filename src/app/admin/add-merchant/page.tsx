'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { registerMerchantAction } from './actions';

export default function AddMerchantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        storeName: '',
        slug: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
        category: 'Restaurants',
        subscriptionType: 'Free',
    });

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

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
                .replace(/[^\w\s-]/g, '') // Remove special chars
                .replace(/\s+/g, '-')     // Replace spaces with hyphens
                .trim();

            setFormData(prev => ({
                ...prev,
                storeName: value,
                slug: generatedSlug
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use the Server Action for atomic registration
            const result = await registerMerchantAction(formData);

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-100">
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
                        {/* Store Information */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">بيانات المتجر</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">اسم المتجر</label>
                                    <input
                                        type="text"
                                        name="storeName"
                                        required
                                        value={formData.storeName}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="مطعم السعادة"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">الرابط الفرعي (Slug)</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        required
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 focus:outline-none cursor-not-allowed font-mono text-sm"
                                        placeholder="store-slug"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">التصنيف</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    >
                                        <option>Restaurants</option>
                                        <option>Electronics</option>
                                        <option>Clothing</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">نوع الاشتراك</label>
                                    <select
                                        name="subscriptionType"
                                        value={formData.subscriptionType}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    >
                                        <option>Free</option>
                                        <option>Pro</option>
                                        <option>Premium</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">بيانات المالك والحساب</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">اسم المالك</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        required
                                        value={formData.ownerName}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="محمد علي"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="+964..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="merchant@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">كلمة المرور</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
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
