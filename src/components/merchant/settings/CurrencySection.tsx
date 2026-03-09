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
            title="عملة المتجر"
            subtitle="العملة الأساسية التي سيتم عرض أسعار منتجاتك بها."
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            headerAction={
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="space-y-3 max-w-md">
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">العملة المفضلة</label>
                <div className="relative">
                    <select
                        value={store?.currency_preference || 'IQD'}
                        onChange={(e) => setStore((prev: any) => prev ? { ...prev, currency_preference: e.target.value as 'IQD' | 'USD' } : null)}
                        className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    >
                        <option value="IQD">الدينار العراقي (IQD - د.ع)</option>
                        <option value="USD">الدولار الأمريكي (USD - $)</option>
                    </select>
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-2">
                    <span className="font-bold text-amber-500">ملاحظة:</span> تغيير العملة <span className="underline pr-1">لن يقوم</span> بتحويل أسعار منتجاتك رياضياً. فقط سيتم تغيير الرمز المعروض.
                </p>
            </div>
        </Card>
    );
}
