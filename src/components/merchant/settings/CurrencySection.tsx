'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CurrencySectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
}

export function CurrencySection({
    store,
    setStore,
    saving,
    onSave
}: CurrencySectionProps) {
    return (
        <Card
            compact
            title="عملة المتجر"
            subtitle="العملة الأساسية التي سيتم عرض أسعار منتجاتك بها."
            icon={
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            headerAction={
                <Button size="sm" loading={saving} onClick={onSave} leftIcon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="space-y-1 max-w-md">
                <label className="text-[9px] lg:text-[10px] font-bold text-black uppercase tracking-widest pr-1">العملة المفضلة</label>
                <div className="relative">
                    <select
                        value={store?.currency_preference || 'IQD'}
                        onChange={(e) => setStore((prev: any) => prev ? { ...prev, currency_preference: e.target.value as 'IQD' | 'USD' } : null)}
                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-xl px-4 lg:px-5 py-2 lg:py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer leading-tight"
                    >
                        <option value="IQD">الدينار العراقي (IQD - د.ع)</option>
                        <option value="USD">الدولار الأمريكي (USD - $)</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <p className="text-[9px] text-black leading-relaxed pt-1">
                    <span className="font-bold text-amber-500">ملاحظة:</span> تغيير العملة <span className="underline pr-1">لن يقوم</span> بتحويل أسعار منتجاتك رياضياً.
                </p>
            </div>
        </Card>
    );
}
