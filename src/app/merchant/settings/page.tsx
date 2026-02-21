'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Store {
    id: string;
    name: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    logo_url?: string;
    delivery_fees?: {
        baghdad: number;
        provinces: number;
    };
    social_links?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
    };
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !store) return;

        try {
            setSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${store.id}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store_logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store_logos')
                .getPublicUrl(filePath);

            setStore({ ...store, logo_url: publicUrl });

            // Auto-save the logo URL immediately for better UX
            await supabase
                .from('stores')
                .update({ logo_url: publicUrl })
                .eq('id', store.id);

        } catch (err: any) {
            alert('خطأ في رفع الشعار: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        console.log("ATTEMPTING SAVE WITH STORE");

        // Define payload based strictly on DB Schema to avoid PostgREST silent failures
        const payload = {
            name: store.name || '',
            description: store.description || '',
            phone: store.phone || '',
            email: store.email || '',
            address: store.address || '',
            logo_url: store.logo_url || null,
            social_links: store.social_links || {},
            delivery_fees: store.delivery_fees || { baghdad: 5000, provinces: 8000 }
        };

        console.log("PAYLOAD SENT TO DB:", payload);

        const { error } = await supabase
            .from('stores')
            .update(payload)
            .eq('id', store.id);

        if (error) {
            console.error('Save error:', error);
            toast.error('حدث خطأ أثناء الحفظ: ' + error.message);
        } else {
            toast.success('تم حفظ الإعدادات بنجاح');
            setTimeout(() => window.location.reload(), 1500);
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
        <div className="px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">إعدادات المتجر</h1>
                    <nav className="flex items-center gap-2 mt-1 text-slate-400 font-medium text-[10px] lg:text-xs">
                        <span>الرئيسية</span>
                        <span>/</span>
                        <span className="text-indigo-600">الإعدادات</span>
                    </nav>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-3.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:gap-10">
                {/* General Info */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">المعلومات العامة</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">قم بتحديث اسم متجرك والشعار الخاص بك.</p>
                        </div>
                    </div>
                    <div className="p-6 lg:p-10">
                        <div className="flex flex-col-reverse lg:flex-row items-center lg:items-start gap-10 lg:gap-20">
                            <div className="w-full flex-1 space-y-6 lg:space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">اسم المتجر</label>
                                    <input
                                        type="text"
                                        value={store?.name || ''}
                                        onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="مثال: متجد.علة للأزياء"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">وصف المتجر (اختياري)</label>
                                    <textarea
                                        rows={4}
                                        value={store?.description || ''}
                                        onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                                        placeholder="أفضل متجر لبيع الملابس العصرية..."
                                    />
                                </div>
                            </div>
                            <div className="w-full lg:w-64 flex flex-col items-center gap-4 lg:gap-6">
                                <div className="relative group">
                                    <div className="w-36 h-36 lg:w-44 lg:h-44 bg-indigo-50/50 rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-dashed border-indigo-200 shadow-inner group-hover:border-indigo-400 transition-all">
                                        {store?.logo_url ? (
                                            <img src={store.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <svg className="w-10 h-10 lg:w-12 lg:h-12 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-indigo-400 block px-4">اضغط للرفع</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 w-9 h-9 lg:w-10 lg:h-10 bg-indigo-600 text-white rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 border-2 border-white pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed">يفضل استخدام صورة مربعة بدقة 512x512 بكسل</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">معلومات التواصل</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">كيف يمكن للعملاء الوصول إليك؟</p>
                        </div>
                    </div>
                    <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 lg:gap-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">البريد الإلكتروني للأعمال</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="email"
                                    value={store?.email || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-left"
                                    placeholder="support@salla-store.com"
                                    dir="ltr"
                                />
                                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رقم الهاتف</label>
                            <div className="flex gap-3" dir="ltr">
                                <div className="w-20 lg:w-24 bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-3.5 lg:py-4 text-xs lg:text-sm font-bold flex items-center justify-center text-slate-400" dir="ltr">+964</div>
                                <input
                                    type="tel"
                                    value={store?.phone || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    className="flex-1 bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-left"
                                    placeholder="770 123 4567"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">العنوان الفيزيائي (اختياري)</label>
                            <input
                                type="text"
                                value={store?.address || ''}
                                onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                                className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                placeholder="الرياض، حي الملقا، شارع الملك فهد"
                            />
                        </div>
                    </div>
                </div>



                {/* Social Media Links */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-pink-50 text-pink-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">روابط التواصل الاجتماعي</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">اربط متجرك بحساباتك على منصات التواصل.</p>
                        </div>
                    </div>
                    <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 lg:gap-y-8">
                        {/* WhatsApp */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رقم الواتساب</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="tel"
                                    value={store?.social_links?.whatsapp || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, whatsapp: e.target.value } } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all text-left"
                                    placeholder="9647XXXXXXXX"
                                    dir="ltr"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.559.925 3.328 1.413 5.127 1.414 5.564 0 10.091-4.527 10.093-10.091 0-2.693-1.05-5.228-2.955-7.134-1.905-1.906-4.44-2.956-7.134-2.957-5.564 0-10.09 4.526-10.093 10.091 0 1.782.47 3.522 1.36 5.068l-.893 3.255 3.492-.916zm11.503-7.534c.007.133.003.265-.046.39-.156.46-.74.654-1.211.772-.491.125-1.12.094-1.883-.244-.759-.335-1.891-.825-3.372-2.482-1.282-1.438-2.147-3.218-2.398-3.535-.25-.317-.438-.687-.438-1.054 0-.367.187-.706.375-.971.188-.265.407-.315.531-.315.125 0 .25.015.344.015.118.013.232.012.33.082.125.088.438 1.054.469 1.12.031.066.031.132.062.197.051.106.012.213-.038.319l-.375.462c-.046.05-.1.115-.042.215.3.521.664 1.045 1.11 1.543a8.66 8.66 0 001.625 1.48c.11.085.18.103.255.038.075-.065.312-.36.397-.48.084-.121.171-.102.261-.067.09.035.569.269.667.317.098.048.164.072.2.087.034.01.077.01.12.03.111.052.175.25.175.406z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Instagram */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب انستغرام</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="text"
                                    value={store?.social_links?.instagram || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, instagram: e.target.value } } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all text-left"
                                    placeholder="your_handle"
                                    dir="ltr"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* TikTok */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب تيك توك</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="text"
                                    value={store?.social_links?.tiktok || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, tiktok: e.target.value } } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-left"
                                    placeholder="your_handle"
                                    dir="ltr"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.6 8.6 0 01-1.87-1.41v8.74c0 1.39-.3 2.8-.91 4.05a7.8 7.8 0 01-2.49 3.01c-1.25.86-2.73 1.36-4.24 1.47-1.52.11-3.08-.1-4.49-.69a7.8 7.8 0 01-3.23-2.58A7.8 7.8 0 010 13.9c.01-1.39.29-2.8.91-4.05a7.8 7.8 0 012.49-3.01c1.25-.86 2.73-1.36 4.24-1.47 1.52-.11 3.08.1 4.49.69.21.09.41.19.61.3V1.52c-.01-.5-.01-1 0-1.5z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Facebook */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رابط فيسبوك</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="text"
                                    value={store?.social_links?.facebook || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, facebook: e.target.value } } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-left"
                                    placeholder="facebook.com/your-store"
                                    dir="ltr"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>





                {/* Final Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 lg:gap-4 pb-10">
                    <button className="w-full sm:w-auto px-10 py-3.5 lg:py-4 bg-white border border-slate-100 rounded-xl lg:rounded-2xl text-[11px] lg:text-sm text-slate-400 font-bold shadow-sm hover:bg-slate-50 transition-all">إلغاء</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto px-12 py-3.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-bold text-[11px] lg:text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>

            <footer className="text-center pt-10 lg:pt-20 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                    {/* Logout button removed per user request */}
                </div>
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-8 lg:mt-12 bg-slate-50 py-3 lg:py-4 rounded-full inline-block px-6 lg:px-10 border border-slate-100">&copy; {new Date().getFullYear()} SaaSPlus. جميع الحقوق محفوظة.</p>
            </footer>
        </div>
    );
}
