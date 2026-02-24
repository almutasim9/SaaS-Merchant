'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { saveGeneralInfoAction, saveContactInfoAction, saveSocialLinksAction, uploadLogoAction, updateSlugAction, saveStorefrontConfigAction, uploadBannerImageAction, deleteBannerImageAction } from './actions';

interface Store {
    id: string;
    name: string;
    slug: string;
    slug_changed?: boolean;
    description: string;
    phone: string;
    email: string;
    address: string;
    logo_url?: string;
    merchant_id: string;
    delivery_fees?: any;
    social_links?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
    };
    storefront_config?: {
        banner?: { title?: string; subtitle?: string; badge?: string; show?: boolean; images?: string[] };
        about?: { content?: string };
        theme_color?: string;
    };
    subscription_plans?: {
        custom_theme: boolean;
        remove_branding: boolean;
        allow_custom_slug: boolean;
    };
}

function SectionSaveButton({ saving, onClick, label = 'حفظ' }: { saving: boolean; onClick: () => void; label?: string }) {
    return (
        <button
            onClick={onClick}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
            {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> جاري الحفظ...</>
            ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {label}</>
            )}
        </button>
    );
}

export default function MerchantSettingsPage() {
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [savingSocial, setSavingSocial] = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);
    const [slugEditing, setSlugEditing] = useState(false);
    const [newSlug, setNewSlug] = useState('');
    const [slugSaving, setSlugSaving] = useState(false);
    const [showSlugConfirm, setShowSlugConfirm] = useState(false);

    // Independent saving states for storefront config sections
    const [savingAppearance, setSavingAppearance] = useState(false);
    const [savingBanner, setSavingBanner] = useState(false);
    const [savingAbout, setSavingAbout] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('stores')
            .select('*, subscription_plans (custom_theme, remove_branding, allow_custom_slug)')
            .eq('merchant_id', user.id)
            .single();

        if (data) setStore(data);
        setLoading(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !store) return;

        try {
            setSavingLogo(true);
            const fileExt = file.name.split('.').pop() || 'png';

            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]; // Remove data:image/xxx;base64, prefix
                const result = await uploadLogoAction(store.id, base64, fileExt);
                if (result.success && result.url) {
                    setStore({ ...store, logo_url: result.url });
                    toast.success('تم تحديث الشعار بنجاح ✅');
                } else {
                    toast.error(result.error || 'فشل في رفع الشعار');
                }
                setSavingLogo(false);
            };
            reader.onerror = () => {
                toast.error('فشل في قراءة الملف');
                setSavingLogo(false);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            toast.error('خطأ في رفع الشعار: ' + err.message);
            setSavingLogo(false);
        }
    };

    const handleSaveGeneral = async () => {
        if (!store) return;
        setSavingGeneral(true);
        const result = await saveGeneralInfoAction(store.id, { name: store.name, description: store.description });
        if (result.success) toast.success('تم حفظ المعلومات العامة ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        setSavingGeneral(false);
    };

    const handleSaveContact = async () => {
        if (!store) return;
        setSavingContact(true);
        const result = await saveContactInfoAction(store.id, { phone: store.phone, email: store.email, address: store.address });
        if (result.success) toast.success('تم حفظ معلومات التواصل ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        setSavingContact(false);
    };

    const handleSaveSocial = async () => {
        if (!store) return;
        setSavingSocial(true);
        const result = await saveSocialLinksAction(store.id, store.social_links || {});
        if (result.success) toast.success('تم حفظ روابط التواصل الاجتماعي ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        setSavingSocial(false);
    };

    const handleSaveStorefront = async (section: 'appearance' | 'banner' | 'about') => {
        if (!store) return;

        switch (section) {
            case 'appearance': setSavingAppearance(true); break;
            case 'banner': setSavingBanner(true); break;
            case 'about': setSavingAbout(true); break;
        }

        const result = await saveStorefrontConfigAction(store.id, store.storefront_config || {});

        if (result.success) toast.success('تم الحفظ بنجاح ✅');
        else toast.error(result.error || 'فشل في الحفظ');

        switch (section) {
            case 'appearance': setSavingAppearance(false); break;
            case 'banner': setSavingBanner(false); break;
            case 'about': setSavingAbout(false); break;
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !store) return;
        const fileExt = file.name.split('.').pop() || 'png';
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const result = await uploadBannerImageAction(store.id, base64, fileExt);
            if (result.success && result.url) {
                const currentImages = store.storefront_config?.banner?.images || [];
                const updatedConfig = {
                    ...store.storefront_config,
                    banner: { ...store.storefront_config?.banner, images: [...currentImages, result.url] }
                };
                setStore(prev => prev ? { ...prev, storefront_config: updatedConfig } : null);
                await saveStorefrontConfigAction(store.id, updatedConfig);
                toast.success('تم رفع صورة البانر ✅');
            } else {
                toast.error(result.error || 'فشل في رفع الصورة');
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleBannerDelete = async (imgUrl: string) => {
        if (!store) return;
        await deleteBannerImageAction(imgUrl);
        const currentImages = store.storefront_config?.banner?.images || [];
        const updatedImages = currentImages.filter(u => u !== imgUrl);
        const updatedConfig = {
            ...store.storefront_config,
            banner: { ...store.storefront_config?.banner, images: updatedImages }
        };
        setStore(prev => prev ? { ...prev, storefront_config: updatedConfig } : null);
        await saveStorefrontConfigAction(store.id, updatedConfig);
        toast.success('تم حذف الصورة');
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
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">إعدادات المتجر</h1>
                <nav className="flex items-center gap-2 mt-1 text-slate-400 font-medium text-[10px] lg:text-xs">
                    <span>الرئيسية</span>
                    <span>/</span>
                    <span className="text-indigo-600">الإعدادات</span>
                </nav>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:gap-10">
                {/* ═══════════════════ General Info ═══════════════════ */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg lg:text-xl font-bold text-slate-800">المعلومات العامة</h3>
                                <p className="text-slate-400 text-[10px] lg:text-xs font-medium">اسم المتجر والوصف والشعار</p>
                            </div>
                        </div>
                        <SectionSaveButton saving={savingGeneral} onClick={handleSaveGeneral} />
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
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="مثال: متجر علي للأزياء"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">وصف المتجر (اختياري)</label>
                                    <textarea
                                        rows={4}
                                        value={store?.description || ''}
                                        onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                                        placeholder="أفضل متجر لبيع الملابس العصرية..."
                                    />
                                </div>
                            </div>
                            <div className="w-full lg:w-64 flex flex-col items-center gap-4 lg:gap-6">
                                <div className="relative group">
                                    <div className="w-36 h-36 lg:w-44 lg:h-44 bg-indigo-50/50 rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-dashed border-indigo-200 shadow-inner group-hover:border-indigo-400 transition-all">
                                        {savingLogo ? (
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        ) : store?.logo_url ? (
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

                {/* ═══════════════════ Store URL (Slug) ═══════════════════ */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-50 text-amber-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">رابط المتجر (URL)</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">الرابط الذي يصل به العملاء لمتجرك. يمكنك تغييره <span className="text-amber-600 font-bold">مرة واحدة فقط</span>.</p>
                        </div>
                    </div>
                    <div className="p-6 lg:p-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3" dir="ltr">
                                <span className="text-sm text-slate-400 font-medium whitespace-nowrap">saasplus.com/shop/</span>
                                <span className="text-lg font-bold text-indigo-600">{store?.slug}</span>
                            </div>

                            {store?.slug_changed ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-xs font-bold text-slate-400">تم تغيير الرابط مسبقاً. لا يمكن تغييره مرة أخرى.</p>
                                </div>
                            ) : store?.subscription_plans && !store.subscription_plans.allow_custom_slug ? (
                                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-xs font-bold text-amber-700">ميزة تخصيص الرابط (Slug) متاحة للباقات المتقدمة. يرجى الاشتراك للتمتع بها.</p>
                                </div>
                            ) : slugEditing ? (
                                <div className="space-y-4">
                                    <div className="relative" dir="ltr">
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">saasplus.com/shop/</span>
                                        <input
                                            type="text"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="w-full bg-[#FBFBFF] border-2 border-amber-200 rounded-2xl pl-5 pr-44 py-4 text-indigo-600 font-bold focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all text-left"
                                            placeholder="my-store"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (!newSlug || newSlug.length < 3) { toast.error('الرابط يجب أن يكون 3 أحرف على الأقل.'); return; }
                                                setShowSlugConfirm(true);
                                            }}
                                            className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl text-sm hover:bg-amber-600 transition-all active:scale-95"
                                        >تأكيد التغيير</button>
                                        <button onClick={() => { setSlugEditing(false); setNewSlug(''); }} className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all">إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setSlugEditing(true); setNewSlug(store?.slug || ''); }}
                                    className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    تعديل الرابط (مرة واحدة)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════ Contact Info ═══════════════════ */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg lg:text-xl font-bold text-slate-800">معلومات التواصل</h3>
                                <p className="text-slate-400 text-[10px] lg:text-xs font-medium">كيف يمكن للعملاء الوصول إليك؟ ستظهر في واجهة المتجر.</p>
                            </div>
                        </div>
                        <SectionSaveButton saving={savingContact} onClick={handleSaveContact} />
                    </div>
                    <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 lg:gap-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">البريد الإلكتروني للأعمال</label>
                            <div className="relative" dir="ltr">
                                <input
                                    type="email"
                                    value={store?.email || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-left"
                                    placeholder="support@store.com"
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
                                <div className="w-20 lg:w-24 bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-3.5 lg:py-4 text-xs lg:text-sm font-bold text-slate-800 flex items-center justify-center text-slate-400" dir="ltr">+964</div>
                                <input
                                    type="tel"
                                    value={store?.phone || ''}
                                    onChange={(e) => setStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    className="flex-1 bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-left"
                                    placeholder="770 123 4567"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">العنوان (اختياري)</label>
                            <input
                                type="text"
                                value={store?.address || ''}
                                onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                                className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                placeholder="بغداد، المنصور، شارع الأميرات"
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════ Social Media ═══════════════════ */}
                <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-pink-50 text-pink-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg lg:text-xl font-bold text-slate-800">روابط التواصل الاجتماعي</h3>
                                <p className="text-slate-400 text-[10px] lg:text-xs font-medium">ستظهر كأيقونات في واجهة المتجر.</p>
                            </div>
                        </div>
                        <SectionSaveButton saving={savingSocial} onClick={handleSaveSocial} />
                    </div>
                    <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 lg:gap-y-8">
                        {/* WhatsApp */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رقم الواتساب</label>
                            <div className="relative" dir="ltr">
                                <input type="tel" value={store?.social_links?.whatsapp || ''} onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, whatsapp: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all text-left" placeholder="9647XXXXXXXX" dir="ltr" />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.559.925 3.328 1.413 5.127 1.414 5.564 0 10.091-4.527 10.093-10.091 0-2.693-1.05-5.228-2.955-7.134-1.905-1.906-4.44-2.956-7.134-2.957-5.564 0-10.09 4.526-10.093 10.091 0 1.782.47 3.522 1.36 5.068l-.893 3.255 3.492-.916z" /></svg>
                                </div>
                            </div>
                        </div>
                        {/* Instagram */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب انستغرام</label>
                            <div className="relative" dir="ltr">
                                <input type="text" value={store?.social_links?.instagram || ''} onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, instagram: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all text-left" placeholder="your_handle" dir="ltr" />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </div>
                            </div>
                        </div>
                        {/* TikTok */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب تيك توك</label>
                            <div className="relative" dir="ltr">
                                <input type="text" value={store?.social_links?.tiktok || ''} onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, tiktok: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-left" placeholder="your_handle" dir="ltr" />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.6 8.6 0 01-1.87-1.41v8.74c0 1.39-.3 2.8-.91 4.05a7.8 7.8 0 01-2.49 3.01c-1.25.86-2.73 1.36-4.24 1.47-1.52.11-3.08-.1-4.49-.69a7.8 7.8 0 01-3.23-2.58A7.8 7.8 0 010 13.9c.01-1.39.29-2.8.91-4.05a7.8 7.8 0 012.49-3.01c1.25-.86 2.73-1.36 4.24-1.47 1.52-.11 3.08.1 4.49.69.21.09.41.19.61.3V1.52c-.01-.5-.01-1 0-1.5z" /></svg>
                                </div>
                            </div>
                        </div>
                        {/* Facebook */}
                        <div className="space-y-3">
                            <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رابط فيسبوك</label>
                            <div className="relative" dir="ltr">
                                <input type="text" value={store?.social_links?.facebook || ''} onChange={(e) => setStore(prev => prev ? { ...prev, social_links: { ...prev.social_links, facebook: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-left" placeholder="facebook.com/your-store" dir="ltr" />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════ Storefront: Appearance ═══════════════════ */}
            <div className={`bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-6 lg:mb-8 relative ${!store?.subscription_plans?.custom_theme ? 'opacity-80' : ''}`}>
                {!store?.subscription_plans?.custom_theme && (
                    <div className="absolute inset-x-0 bottom-0 top-[88px] z-10 backdrop-blur-[2px] bg-slate-50/50 flex items-center justify-center">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-slate-100 max-w-sm text-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">ميزة احترافية</h4>
                            <p className="text-xs text-slate-500 font-medium">تغيير ألوان المتجر متاح للباقات المتقدمة (الفضية والذهبية). يرجى الترقية.</p>
                        </div>
                    </div>
                )}
                <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-pink-50 text-pink-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">مظهر المتجر</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">تخصيص الألوان والمظهر العام للمتجر</p>
                        </div>
                    </div>
                    {store?.subscription_plans?.custom_theme && (
                        <SectionSaveButton saving={savingAppearance} onClick={() => handleSaveStorefront('appearance')} />
                    )}
                </div>
                <div className={`p-6 lg:p-10 ${!store?.subscription_plans?.custom_theme ? 'pointer-events-none' : ''}`}>
                    <div className="space-y-3">
                        <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1 flex items-center gap-2">
                            اللون الأساسي
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={store?.storefront_config?.theme_color || '#00D084'}
                                onChange={(e) => setStore(prev => prev ? { ...prev, storefront_config: { ...prev.storefront_config, theme_color: e.target.value } } : null)}
                                className="w-14 h-14 rounded-xl cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                            />
                            <div className="flex-1 bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 flex items-center justify-between" dir="ltr">
                                <span>{store?.storefront_config?.theme_color || '#00D084'}</span>
                                <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: store?.storefront_config?.theme_color || '#00D084' }} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">هذا اللون سيستخدم في الأزرار، والروابط، والعناصر البارزة في متجرك.</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════ Storefront: Banner ═══════════════════ */}
            <div className={`bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative ${!store?.subscription_plans?.custom_theme ? 'opacity-80' : ''}`}>
                {!store?.subscription_plans?.custom_theme && (
                    <div className="absolute inset-x-0 bottom-0 top-[88px] z-10 backdrop-blur-[2px] bg-slate-50/50 flex items-center justify-center">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-slate-100 max-w-sm text-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">ميزة احترافية</h4>
                            <p className="text-xs text-slate-500 font-medium">سلايدر الصور وتغيير البانر متاح للباقات المتقدمة (الفضية والذهبية). يرجى الترقية لتفعيل هذه الميزة.</p>
                        </div>
                    </div>
                )}
                <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-50 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">البانر الترويجي</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">عنوان ونص البانر الذي يظهر في الصفحة الرئيسية</p>
                        </div>
                    </div>
                    {store?.subscription_plans?.custom_theme && (
                        <SectionSaveButton saving={savingBanner} onClick={() => handleSaveStorefront('banner')} />
                    )}
                </div>
                <div className={`p-6 lg:p-10 space-y-6 ${!store?.subscription_plans?.custom_theme ? 'pointer-events-none' : ''}`}>
                    {/* Banner Images */}
                    <div className="space-y-3">
                        <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">صور البانر (سلايدر)</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {(store?.storefront_config?.banner?.images || []).map((img, i) => (
                                <div key={i} className="relative group aspect-[16/9] rounded-xl overflow-hidden border border-slate-100">
                                    <img src={img} alt={`بانر ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => handleBannerDelete(img)}
                                        className="absolute top-2 left-2 w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">{i + 1}</div>
                                </div>
                            ))}
                            {/* Upload Button */}
                            <label className="aspect-[16/9] rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                                <svg className="w-8 h-8 text-emerald-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[10px] font-bold text-emerald-500">إضافة صورة</span>
                                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-400">يُفضل استخدام صور بأبعاد 16:9 (مثلاً 1200×675). الصور ستعرض كسلايدر تلقائي.</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            إذا لم تُرفع صور، سيظهر بانر نصي بالتصميم الافتراضي. إذا رُفعت صور، يختفي البانر النصي ويظهر السلايدر.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">الشارة</label>
                                <input type="text" value={store?.storefront_config?.banner?.badge || ''} onChange={(e) => setStore(prev => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, badge: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="جديد" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">العنوان</label>
                                <input type="text" value={store?.storefront_config?.banner?.title || ''} onChange={(e) => setStore(prev => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, title: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="مرحباً بكم في متجرنا" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">النص الفرعي</label>
                                <input type="text" value={store?.storefront_config?.banner?.subtitle || ''} onChange={(e) => setStore(prev => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, subtitle: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="تصفح أفضل المنتجات بأسعار مميزة" />
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* ═══════════════════ Storefront: About Us ═══════════════════ */}
            < div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden" >
                <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-cyan-50 text-cyan-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-bold text-slate-800">صفحة من نحن</h3>
                            <p className="text-slate-400 text-[10px] lg:text-xs font-medium">وصف تفصيلي عن المتجر يظهر في صفحة &quot;من نحن&quot;</p>
                        </div>
                    </div>
                    <SectionSaveButton saving={savingAbout} onClick={() => handleSaveStorefront('about')} />
                </div>
                <div className="p-6 lg:p-10 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">محتوى صفحة من نحن</label>
                        <textarea
                            rows={6}
                            value={store?.storefront_config?.about?.content || ''}
                            onChange={(e) => setStore(prev => prev ? { ...prev, storefront_config: { ...prev.storefront_config, about: { ...prev.storefront_config?.about, content: e.target.value } } } : null)}
                            className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 transition-all resize-none"
                            placeholder="نحن متجر إلكتروني رائد نسعى لتقديم أفضل المنتجات التي تلبي احتياجاتكم اليومية بجودة عالية وأسعار منافسة..."
                        />
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-slate-500 leading-relaxed">هذا النص يظهر في صفحة &quot;من نحن&quot; في المتجر. إذا تركته فارغاً، سيعرض نص افتراضي. يمكنك أيضاً استخدام وصف المتجر في المعلومات العامة.</p>
                    </div>
                </div>
            </div >

            {/* ═══════════════════ Storefront: Contact Info Reminder ═══════════════════ */}
            < div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden" >
                <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-violet-50 text-violet-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg lg:text-xl font-bold text-slate-800">صفحة تواصل معنا</h3>
                        <p className="text-slate-400 text-[10px] lg:text-xs font-medium">بيانات التواصل تُسحب تلقائياً من الأقسام أعلاه</p>
                    </div>
                </div>
                <div className="p-6 lg:p-10">
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 space-y-4">
                        <p className="text-sm font-bold text-violet-800">📋 صفحة &quot;تواصل معنا&quot; تعرض تلقائياً:</p>
                        <ul className="space-y-2 text-xs text-violet-700 leading-relaxed">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                <strong>رقم الهاتف</strong> — من قسم معلومات التواصل {store?.phone ? <span className="text-emerald-600">✓ مُعبأ</span> : <span className="text-rose-500">✗ فارغ</span>}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                <strong>البريد الإلكتروني</strong> — من قسم معلومات التواصل {store?.email ? <span className="text-emerald-600">✓ مُعبأ</span> : <span className="text-rose-500">✗ فارغ</span>}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                <strong>واتساب</strong> — من قسم التواصل الاجتماعي {store?.social_links?.whatsapp ? <span className="text-emerald-600">✓ مُعبأ</span> : <span className="text-rose-500">✗ فارغ</span>}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                <strong>روابط التواصل الاجتماعي</strong> — فيسبوك، انستغرام، تيك توك
                            </li>
                        </ul>
                        <p className="text-xs text-violet-600 pt-1">💡 املأ الحقول في الأقسام أعلاه لتظهر تلقائياً في صفحة &quot;تواصل معنا&quot;</p>
                    </div>
                </div>
            </div >

            <footer className="text-center pt-10 lg:pt-20 border-t border-slate-100">
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-8 lg:mt-12 bg-slate-50 py-3 lg:py-4 rounded-full inline-block px-6 lg:px-10 border border-slate-100">&copy; {new Date().getFullYear()} SaaSPlus. جميع الحقوق محفوظة.</p>
            </footer>

            {/* Slug Confirmation Modal */}
            {
                showSlugConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowSlugConfirm(false)} />
                        <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-800">تأكيد تغيير الرابط</h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right space-y-2">
                                    <p className="text-sm font-bold text-amber-800">⚠️ تنبيه مهم:</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">تغيير رابط المتجر سيؤثر على جميع الروابط السابقة. <strong>لا يمكنك التراجع.</strong></p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 text-center" dir="ltr">
                                    <p className="text-xs text-slate-400 mb-1">الرابط الجديد:</p>
                                    <p className="text-lg font-bold text-indigo-600">saasplus.com/shop/{newSlug}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    disabled={slugSaving}
                                    onClick={async () => {
                                        if (!store) return;
                                        setSlugSaving(true);
                                        const result = await updateSlugAction(store.id, store.merchant_id, newSlug);
                                        if (result.success) {
                                            toast.success('تم تغيير الرابط بنجاح! 🎉');
                                            setShowSlugConfirm(false);
                                            setSlugEditing(false);
                                            setStore(prev => prev ? { ...prev, slug: newSlug, slug_changed: true } : null);
                                        } else toast.error(result.error || 'حدث خطأ.');
                                        setSlugSaving(false);
                                    }}
                                    className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 text-sm"
                                >{slugSaving ? 'جاري التحديث...' : 'نعم، غيّر الرابط'}</button>
                                <button onClick={() => setShowSlugConfirm(false)} className="px-6 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">تراجع</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
