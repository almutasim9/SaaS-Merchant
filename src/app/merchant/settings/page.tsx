'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    saveGeneralInfoAction,
    saveContactInfoAction,
    saveSocialLinksAction,
    uploadLogoAction,
    updateSlugAction,
    saveStorefrontConfigAction,
    uploadBannerImageAction,
    deleteBannerImageAction,
    saveCurrencyPreferenceAction,
    saveOrderingPreferencesAction
} from './actions';
import { useFeatureGate } from '@/hooks/useFeatureGate';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// UI Components
import { GeneralInfoSection } from '@/components/merchant/settings/GeneralInfoSection';
import { ContactInfoSection } from '@/components/merchant/settings/ContactInfoSection';
import { SocialLinksSection } from '@/components/merchant/settings/SocialLinksSection';
import { StoreURLSection } from '@/components/merchant/settings/StoreURLSection';
import { AppearanceSection } from '@/components/merchant/settings/AppearanceSection';
import { BannerSection } from '@/components/merchant/settings/BannerSection';
import { AboutUsSection } from '@/components/merchant/settings/AboutUsSection';
import { CurrencySection } from '@/components/merchant/settings/CurrencySection';
import { OrderingPreferencesSection } from '@/components/merchant/settings/OrderingPreferencesSection';
import { NotificationDebugSection } from '@/components/merchant/settings/NotificationDebugSection';

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
    currency_preference?: 'IQD' | 'USD';
    accepts_orders?: boolean;
    offers_delivery?: boolean;
    offers_pickup?: boolean;
    delivery_fees?: any;
    social_links?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
    };
    storefront_config?: {
        banner?: { title?: string; subtitle?: string; badge?: string; show?: boolean; images?: string[] };
        about?: {
            content?: string;
            heroSubtitle?: string;
            heroTitle?: string;
            value1Title?: string;
            value1Desc?: string;
            value2Title?: string;
            value2Desc?: string;
            value3Title?: string;
            value3Desc?: string;
        };
        theme_color?: string;
    };
    subscription_plans?: {
        custom_theme: boolean;
        remove_branding: boolean;
        allow_custom_slug: boolean;
        enable_ordering: boolean;
        allow_social_links: boolean;
        allow_banner: boolean;
        allow_variants: boolean;
        allow_excel_import: boolean;
        max_products: number;
        max_categories: number;
        max_delivery_zones: number;
        max_monthly_orders: number;
    };
}

export default function MerchantSettingsPage() {
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [savingSocial, setSavingSocial] = useState(false);
    const [savingCurrency, setSavingCurrency] = useState(false);
    const [savingOrdering, setSavingOrdering] = useState(false);
    const [savingLogo, setSavingLogo] = useState(false);
    const [slugEditing, setSlugEditing] = useState(false);
    const [newSlug, setNewSlug] = useState('');
    const [slugSaving, setSlugSaving] = useState(false);
    const [showSlugConfirm, setShowSlugConfirm] = useState(false);

    // Independent saving states for storefront config sections
    // Independent saving states for storefront config sections
    const [savingAppearance, setSavingAppearance] = useState(false);
    const [savingBanner, setSavingBanner] = useState(false);
    const [savingAbout, setSavingAbout] = useState(false);

    const router = useRouter();
    const { plan } = useFeatureGate(store?.id || null);

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('stores')
            .select('*, subscription_plans (custom_theme, remove_branding, allow_custom_slug, enable_ordering, allow_social_links, allow_banner, allow_variants, allow_excel_import, max_products, max_categories, max_delivery_zones, max_monthly_orders)')
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
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
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

    const handleSaveCurrency = async () => {
        if (!store?.currency_preference) return;
        setSavingCurrency(true);
        const result = await saveCurrencyPreferenceAction(store.id, store.currency_preference);
        if (result.success) toast.success('تم حفظ عملة المتجر ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        setSavingCurrency(false);
    };

    const handleSaveOrdering = async () => {
        if (!store) return;
        setSavingOrdering(true);
        const result = await saveOrderingPreferencesAction(store.id, {
            accepts_orders: !!store.accepts_orders,
            offers_delivery: !!store.offers_delivery,
            offers_pickup: !!store.offers_pickup,
        });
        if (result.success) toast.success('تم حفظ خيارات الطلب ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        setSavingOrdering(false);
    };

    const handleSaveStorefront = async (section: 'appearance' | 'banner' | 'about') => {
        if (!store) return;
        section === 'appearance' ? setSavingAppearance(true) : section === 'banner' ? setSavingBanner(true) : setSavingAbout(true);
        const result = await saveStorefrontConfigAction(store.id, store.storefront_config || {});
        if (result.success) toast.success('تم الحفظ بنجاح ✅');
        else toast.error(result.error || 'فشل في الحفظ');
        section === 'appearance' ? setSavingAppearance(false) : section === 'banner' ? setSavingBanner(false) : setSavingAbout(false);
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
            } else toast.error(result.error || 'فشل في رفع الصورة');
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

    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'ordering'>('general');

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'المعلومات العامة', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'appearance', label: 'الواجهة والتصميم', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 01.3-.7l7-7a1 1 0 011.4 0l7 7a1 1 0 01.3.7v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V7a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20v-2a2 2 0 012-2h6a2 2 0 012 2v2" /><rect x="4" y="10" width="16" height="10" rx="2" strokeWidth={2} /></svg> },
        { id: 'ordering', label: 'إعدادات الطلبات', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    ];

    return (
        <div className="px-4 lg:px-10 pb-20 space-y-4 lg:space-y-5 pt-6 lg:pt-0" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-black">إعدادات المتجر</h1>
                    <nav className="flex items-center gap-2 mt-1 text-black font-medium text-[10px] lg:text-xs">
                        <span>الرئيسية</span>
                        <span>/</span>
                        <span className="text-black">الإعدادات</span>
                    </nav>
                </div>
                
                {/* Modern Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-black hover:text-black'
                            }`}
                        >
                            {React.cloneElement(tab.icon as any, { className: 'w-4 h-4' })}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:gap-6">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                        <div className="lg:col-span-2">
                            <GeneralInfoSection
                                store={store}
                                setStore={setStore}
                                saving={savingGeneral}
                                onSave={handleSaveGeneral}
                                onLogoUpload={handleLogoUpload}
                                savingLogo={savingLogo}
                            />
                        </div>

                        <ContactInfoSection
                            store={store}
                            setStore={setStore}
                            saving={savingContact}
                            onSave={handleSaveContact}
                        />

                        <SocialLinksSection
                            store={store}
                            setStore={setStore}
                            saving={savingSocial}
                            onSave={handleSaveSocial}
                        />

                        <StoreURLSection
                            store={store}
                            setStore={setStore}
                            slugEditing={slugEditing}
                            setSlugEditing={setSlugEditing}
                            newSlug={newSlug}
                            setNewSlug={setNewSlug}
                            onSaveClick={() => setShowSlugConfirm(true)}
                            onCancel={() => setSlugEditing(false)}
                            plan={plan}
                        />

                        <CurrencySection
                            store={store}
                            setStore={setStore}
                            saving={savingCurrency}
                            onSave={handleSaveCurrency}
                        />
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <>
                        <AppearanceSection
                            store={store}
                            setStore={setStore}
                            saving={savingAppearance}
                            onSave={() => handleSaveStorefront('appearance')}
                        />

                        <BannerSection
                            store={store}
                            setStore={setStore}
                            saving={savingBanner}
                            onSave={() => handleSaveStorefront('banner')}
                            onUpload={handleBannerUpload}
                            onDelete={handleBannerDelete}
                            plan={plan}
                        />

                        <AboutUsSection
                            store={store}
                            setStore={setStore}
                            saving={savingAbout}
                            onSave={() => handleSaveStorefront('about')}
                            plan={plan}
                        />
                    </>
                )}

                {activeTab === 'ordering' && (
                    <>
                        <OrderingPreferencesSection
                            store={store}
                            setStore={setStore}
                            saving={savingOrdering}
                            onSave={handleSaveOrdering}
                            plan={plan}
                        />
                        {store && <NotificationDebugSection storeId={store.id} />}
                    </>
                )}
            </div>

            <footer className="text-center pt-10 border-t border-slate-100">
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] mt-8 bg-slate-50 py-3 rounded-full inline-block px-6 border border-slate-100">&copy; {new Date().getFullYear()} TajerZone. جميع الحقوق محفوظة.</p>
            </footer>

            <Modal
                isOpen={showSlugConfirm}
                onClose={() => setShowSlugConfirm(false)}
                title="تأكيد تغيير الرابط"
                variant="amber"
                footer={
                    <>
                        <Button
                            variant="primary"
                            className="bg-amber-500 hover:bg-amber-600 flex-1"
                            loading={slugSaving}
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
                        >
                            نعم، غيّر الرابط
                        </Button>
                        <Button variant="secondary" onClick={() => setShowSlugConfirm(false)}>تراجع</Button>
                    </>
                }
            >
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right space-y-2">
                    <p className="text-sm font-bold text-amber-800">⚠️ تنبيه مهم:</p>
                    <p className="text-xs text-amber-700 leading-relaxed">تغيير رابط المتجر سيؤثر على جميع الروابط السابقة. <strong>لا يمكنك التراجع.</strong></p>
                </div>
            </Modal>
        </div>
    );
}
