'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface AboutUsSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
    plan: any;
}

export function AboutUsSection({
    store,
    setStore,
    saving,
    onSave,
    plan
}: AboutUsSectionProps) {
    const allowAboutPage = plan?.allow_about_page;

    const updateAbout = (field: string, value: string) => {
        setStore((prev: any) => prev ? {
            ...prev,
            storefront_config: {
                ...prev.storefront_config,
                about: {
                    ...prev.storefront_config?.about,
                    [field]: value
                }
            }
        } : null);
    };

    return (
        <Card
            compact
            className={!allowAboutPage ? 'opacity-80' : ''}
            title="صفحة من نحن"
            subtitle="وصف تفصيلي عن المتجر وقصته وقيمه الأساسية."
            icon={
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            headerAction={allowAboutPage && (
                <Button size="sm" loading={saving} onClick={onSave} leftIcon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            )}
        >
            <div className="relative">
                {!allowAboutPage && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-slate-50/50 flex items-center justify-center -m-6 lg:-m-10">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-slate-100 max-w-sm text-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">ميزة احترافية</h4>
                            <p className="text-xs text-slate-500 font-medium">تخصيص صفحة "من نحن" متاح حصرياً للباقة الذهبية للمتاجر المتميزة.</p>
                        </div>
                    </div>
                )}

                <div className={!allowAboutPage ? 'pointer-events-none' : 'space-y-4'}>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-800">القسم العلوي (البانر)</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <Input
                                compact
                                label="النص الصغير (الوسم)"
                                value={store?.storefront_config?.about?.heroSubtitle ?? 'قصتنا'}
                                onChange={(e) => updateAbout('heroSubtitle', e.target.value)}
                            />
                            <Input
                                compact
                                label="العنوان الرئيسي"
                                value={store?.storefront_config?.about?.heroTitle ?? 'نبني المستقبل لبناء تجربة تسوق أفضل'}
                                onChange={(e) => updateAbout('heroTitle', e.target.value)}
                            />
                        </div>
                    </div>

                    <Textarea
                        compact
                        label="وصف المتجر التفصيلي"
                        rows={3}
                        value={store?.storefront_config?.about?.content || ''}
                        onChange={(e) => updateAbout('content', e.target.value)}
                        placeholder="نحن متجر إلكتروني رائد نسعى لتقديم أفضل المنتجات..."
                    />

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                            قيم ومميزات المتجر
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {[1, 2, 3].map((num) => (
                                <div key={num} className="p-3 bg-white border border-slate-100 rounded-xl space-y-2 shadow-sm hover:border-cyan-200 transition-colors">
                                    <Input
                                        compact
                                        label={`عنوان الميزة ${num}`}
                                        value={store?.storefront_config?.about?.[`value${num}Title`] ?? ''}
                                        onChange={(e) => updateAbout(`value${num}Title`, e.target.value)}
                                        className="bg-slate-50 border-slate-100"
                                    />
                                    <Textarea
                                        compact
                                        label="الوصف"
                                        rows={2}
                                        value={store?.storefront_config?.about?.[`value${num}Desc`] ?? ''}
                                        onChange={(e) => updateAbout(`value${num}Desc`, e.target.value)}
                                        className="bg-slate-50 border-slate-100 text-[11px]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
