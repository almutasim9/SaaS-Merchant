'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicRegisterMerchantAction } from '@/app/actions/public-register';
import { checkEmailExists, checkSlugExists } from '@/app/actions/check-registration';

interface RegisterMerchantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegisterMerchantModal({ isOpen, onClose }: RegisterMerchantModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        storeName: '',
        slug: '',
        category: 'Restaurants',
        subscriptionType: 'Free',
        ownerName: '',
        phone: '',
        email: '',
        password: ''
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'storeName') {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, storeName: value, slug: generatedSlug }));
        } else if (name === 'slug') {
            // Auto-lowercase and sanitize slug
            const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, slug: sanitizedSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (error) setError(null);
    };

    const handleNextStep = async () => {
        if (step === 1) {
            if (!formData.email || !formData.password || !formData.phone || !formData.ownerName) {
                setError('يرجى ملء جميع الحقول المطلوبة.');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const result = await checkEmailExists(formData.email);
                if (result.exists) {
                    setError('هذا البريد الإلكتروني مسجل مسبقاً.');
                    setLoading(false);
                    return;
                }
                setStep(2);
            } catch (err) {
                console.error(err);
                setError('حدث خطأ أثناء التحقق من البريد الإلكتروني.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            await handleNextStep();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Final check for slug availability
            const slugCheck = await checkSlugExists(formData.slug);
            if (slugCheck.exists) {
                throw new Error('رابط المتجر (Slug) مستخدم بالفعل، يرجى اختيار اسم آخر.');
            }

            const result = await publicRegisterMerchantAction(formData);
            if (!result.success) throw new Error(result.error);
            setSuccess(true);
            setTimeout(() => {
                router.push('/merchant/dashboard');
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2" />

                <div className="p-8 md:p-12">
                    {success ? (
                        <div className="text-center py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">مبروك! متجرك جاهز 🚀</h2>
                            <p className="text-slate-500 font-medium text-lg">جاري تجهيز لوحة التحكم الخاصة بك...</p>
                            <div className="w-full max-w-xs mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 animate-progress origin-right w-full" />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {step === 1 ? 'إنشاء حساب جديد 👤' : 'إعداد متجرك 🏪'}
                                </h2>
                                <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">
                                    خطوة {step} من 2
                                </p>
                            </div>

                            {/* Step 1: Owner Info */}
                            {step === 1 && (
                                <>
                                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">البريد الإلكتروني</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="your@email.com"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">كلمة المرور</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">رقم الهاتف</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="07xxxxxxxxx"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">اسمك الكامل</label>
                                            <input
                                                type="text"
                                                name="ownerName"
                                                value={formData.ownerName}
                                                onChange={handleInputChange}
                                                placeholder="الاسم الثلاثي"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Login Link */}
                                    <div className="text-center pt-2">
                                        <p className="text-sm text-slate-400">
                                            لديك حساب بالفعل؟{' '}
                                            <a href="/login" className="text-indigo-600 font-bold hover:underline">تسجيل الدخول</a>
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Store Info */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">اسم المتجر</label>
                                        <input
                                            type="text"
                                            name="storeName"
                                            value={formData.storeName}
                                            onChange={handleInputChange}
                                            placeholder="مثال: متجر السعادة"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none text-lg placeholder:font-normal placeholder:text-slate-300"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">رابط المتجر (Slug)</label>
                                        <div className="relative" dir="ltr">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">saasplus.com/</span>
                                            <input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-32 pr-5 py-4 text-indigo-600 font-bold focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">التصنيف</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-800 font-bold focus:border-indigo-500 outline-none appearance-none"
                                            >
                                                <option value="Restaurants">مطاعم وكافيهات</option>
                                                <option value="Clothing">ملابس وأزياء</option>
                                                <option value="Electronics">إلكترونيات</option>
                                                <option value="Other">أخرى</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">الباقة</label>
                                            <div className="relative">
                                                <select
                                                    name="subscriptionType"
                                                    value={formData.subscriptionType}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-800 font-bold focus:border-indigo-500 outline-none appearance-none"
                                                >
                                                    <option value="Free">مجانية (Starter)</option>
                                                    <option value="Pro">احترافية (Pro)</option>
                                                    <option value="Premium">أعمال (Premium)</option>
                                                </select>
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-shake">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                {step === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        رجوع
                                    </button>
                                )}
                                <button
                                    type={step === 1 ? 'button' : 'submit'}
                                    disabled={loading}
                                    onClick={step === 1 ? handleNextStep : undefined}
                                    className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {step === 1 ? 'الخطوة التالية' : 'إنشاء المتجر الآن'}
                                            <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            <style jsx global>{`
                @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                .animate-progress { animation: progress 2.5s ease-out forwards; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div >
    );
}
