'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AppearanceSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
}

export function AppearanceSection({
    store,
    setStore,
    saving,
    onSave
}: AppearanceSectionProps) {
    const hasCustomTheme = store?.subscription_plans?.custom_theme;

    return (
        <Card
            className={!hasCustomTheme ? 'opacity-80' : ''}
            title="مظهر المتجر"
            subtitle="تخصيص الألوان والمظهر العام للمتجر"
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            }
            headerAction={hasCustomTheme && (
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            )}
        >
            <div className="relative">
                {!hasCustomTheme && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-slate-50/50 flex items-center justify-center -m-6 lg:-m-10">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-slate-100 max-w-sm text-center">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg">ميزة احترافية</h4>
                            <p className="text-xs text-slate-500 font-medium">تغيير ألوان المتجر متاح للباقات المتقدمة (الفضية والذهبية). يرجى الترقية.</p>
                        </div>
                    </div>
                )}

                <div className={!hasCustomTheme ? 'pointer-events-none' : ''}>
                    <div className="space-y-3">
                        <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">اللون الأساسي</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={store?.storefront_config?.theme_color || '#00D084'}
                                onChange={(e) => setStore((prev: any) => prev ? { ...prev, storefront_config: { ...prev.storefront_config, theme_color: e.target.value } } : null)}
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
        </Card>
    );
}
