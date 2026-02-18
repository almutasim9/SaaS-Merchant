'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Store {
    id: string;
    name: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    logo_url?: string;
}

export default function MerchantSettingsPage() {
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', user.id)
            .single();

        if (data) {
            setStore(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        const { error } = await supabase
            .from('stores')
            .update({
                name: store.name,
                description: store.description,
                phone: store.phone,
                email: store.email,
                address: store.address
            })
            .eq('id', store.id);

        if (error) {
            alert('حدث خطأ أثناء الحفظ');
        } else {
            alert('تم حفظ الإعدادات بنجاح');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-10 pb-20 space-y-10" dir="rtl">
            {/* Header Content */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">إعدادات المتجر</h1>
                    <nav className="flex items-center gap-2 mt-1 text-slate-400 font-medium text-xs">
                        <span>الرئيسية</span>
                        <span>/</span>
                        <span className="text-indigo-600">الإعدادات</span>
                    </nav>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* General Info */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">المعلومات العامة</h3>
                            <p className="text-slate-400 text-xs font-medium">قم بتحديث اسم متجرك والشعار الخاص بك.</p>
                        </div>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="flex items-start gap-20">
                            <div className="flex-1 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">اسم المتجر</label>
                                    <input
                                        type="text"
                                        value={store?.name || ''}
                                        onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="مثال: متجر سلة للأزياء"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">وصف المتجر (اختياري)</label>
                                    <textarea
                                        rows={4}
                                        value={store?.description || ''}
                                        onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                                        placeholder="أفضل متجر لبيع الملابس العصرية في المملكة العربية السعودية."
                                    />
                                </div>
                            </div>
                            <div className="w-64 flex flex-col items-center gap-6">
                                <div className="relative group">
                                    <div className="w-44 h-44 bg-[#F3E8D3] rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                        <img src="/placeholder-logo.png" alt="Logo" className="w-24 h-24 object-contain opacity-40" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 border-2 border-white">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed">يفضل استخدام صورة مربعة بدقة 512x512 بكسل</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">معلومات التواصل</h3>
                            <p className="text-slate-400 text-xs font-medium">كيف يمكن للعملاء الوصول إليك؟</p>
                        </div>
                    </div>
                    <div className="p-10 grid grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">البريد الإلكتروني للأعمال</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={store?.email || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all pr-12"
                                    placeholder="support@salla-store.com"
                                />
                                <svg className="w-5 h-5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رقم الهاتف</label>
                            <div className="flex gap-3">
                                <div className="w-24 bg-[#FBFBFF] border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold flex items-center justify-center text-slate-400">+966</div>
                                <input
                                    type="tel"
                                    value={store?.phone || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    className="flex-1 bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    placeholder="50 123 4567"
                                />
                            </div>
                        </div>
                        <div className="col-span-2 space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">العنوان الفيزيائي (اختياري)</label>
                            <input
                                type="text"
                                value={store?.address || ''}
                                onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                                className="w-full bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                placeholder="الرياض، حي الملقا، شارع الملك فهد"
                            />
                        </div>
                    </div>
                </div>

                {/* Shipping & Payment */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 0110 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">الدفع والشحن</h3>
                            <p className="text-slate-400 text-xs font-medium">إدارة طرق الدفع وخيارات شركات الشحن.</p>
                        </div>
                    </div>
                    <div className="p-10 space-y-12">
                        {/* Payment Methods */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">طرق الدفع المفعلة</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-[2rem] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">بطاقة ائتمان / مدى</p>
                                            <p className="text-[10px] font-medium text-slate-400">عمولة 2.5%</p>
                                        </div>
                                    </div>
                                    <div className="w-14 h-8 bg-indigo-600 rounded-full relative cursor-pointer shadow-indigo-600/20 shadow-lg">
                                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all translate-x-6"></div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-between">
                                    <div className="flex items-center gap-4 opacity-50">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 0110 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">الدفع عند الاستلام</p>
                                            <p className="text-[10px] font-medium text-slate-400">رسوم إضافية 15 ر.س</p>
                                        </div>
                                    </div>
                                    <div className="w-14 h-8 bg-slate-200 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Company */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">شركة الشحن الافتراضية</h4>
                            <div className="relative">
                                <select className="w-full bg-[#FBFBFF] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer">
                                    <option>أرامكس (Aramex)</option>
                                    <option>سمسا (SMSA)</option>
                                    <option>سبيشل لاين</option>
                                </select>
                                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                                <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-xs font-medium text-amber-700 leading-relaxed">يتم تطبيق أسعار الشحن بناءً على الاتفاقية المبرمة مع المزود. يرجى التأكد من تحديث أسعار الشحن في صفحة "إعدادات الشحن" التفصيلية.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Action Buttons */}
                <div className="flex items-center justify-end gap-4 pb-10">
                    <button className="px-10 py-4 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold shadow-sm hover:bg-slate-50 transition-all">إلغاء</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>

            <footer className="text-center pt-20 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-4 text-slate-400 hover:text-rose-500 transition-all">
                        <svg className="w-6 h-6 -scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-left select-none pointer-events-none">
                            <p className="text-sm font-bold text-slate-800 leading-none">أحمد العتيبي</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">مدير المتجر</span>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-400 font-medium border border-slate-200 overflow-hidden shadow-inner">
                            <svg className="w-8 h-8 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-12 bg-slate-50 py-4 rounded-full inline-block px-10 border border-slate-100">© 2024 نظام إدارة التاجر. جميع الحقوق محفوظة لشركة النخبة للتجارة.</p>
            </footer>
        </div>
    );
}
