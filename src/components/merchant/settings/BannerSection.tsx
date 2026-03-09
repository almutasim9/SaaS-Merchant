'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BannerSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (imgUrl: string) => void;
    plan: any;
}

export function BannerSection({
    store,
    setStore,
    saving,
    onSave,
    onUpload,
    onDelete,
    plan
}: BannerSectionProps) {
    const allowBanner = plan?.allow_banner;

    return (
        <Card
            className={!allowBanner ? 'opacity-80' : ''}
            title="البانر الترويجي"
            subtitle="عرض صور ترويجية ونصوص جذابة في أعلى المتجر."
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            }
            headerAction={allowBanner && (
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            )}
        >
            <div className="relative">
                {!allowBanner && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-slate-50/50 flex items-center justify-center -m-6 lg:-m-10">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-slate-100 max-w-sm text-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">ميزة احترافية</h4>
                            <p className="text-xs text-slate-500 font-medium">سلايدر الصور وتغيير البانر متاح حصرياً للباقة الذهبية. يرجى الترقية لتفعيل هذه الميزة.</p>
                        </div>
                    </div>
                )}

                <div className={!allowBanner ? 'pointer-events-none' : 'space-y-6'}>
                    <div className="space-y-3">
                        <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">صور البانر (سلايدر)</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {(store?.storefront_config?.banner?.images || []).map((img: any, i: number) => (
                                <div key={i} className="relative group aspect-[16/9] rounded-xl overflow-hidden border border-slate-100">
                                    <img src={img} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => onDelete(img)}
                                        className="absolute top-2 left-2 w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-[16/9] rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                                <svg className="w-8 h-8 text-emerald-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                <span className="text-[10px] font-bold text-emerald-500">إضافة صورة</span>
                                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-400">يفضل استخدام صور بأبعاد 16:9 (مثلاً 1200×675).</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">الشارة</label>
                                <input type="text" value={store?.storefront_config?.banner?.badge || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, badge: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="جديد" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">العنوان</label>
                                <input type="text" value={store?.storefront_config?.banner?.title || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, title: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="مرحباً بكم في متجرنا" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">النص الفرعي</label>
                                <input type="text" value={store?.storefront_config?.banner?.subtitle || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, storefront_config: { ...prev.storefront_config, banner: { ...prev.storefront_config?.banner, subtitle: e.target.value } } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-100 transition-all" placeholder="تصفح أفضل المنتجات..." />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
