'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ContactInfoSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
}

export function ContactInfoSection({
    store,
    setStore,
    saving,
    onSave
}: ContactInfoSectionProps) {
    return (
        <Card
            compact
            title="معلومات التواصل"
            subtitle="كيف يمكن للعملاء الوصول إليك؟ ستظهر في واجهة المتجر."
            icon={
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            }
            headerAction={
                <Button size="sm" loading={saving} onClick={onSave} leftIcon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 lg:gap-y-5">
                <Input
                    compact
                    label="البريد الإلكتروني للأعمال"
                    type="email"
                    dir="ltr"
                    value={store?.email || ''}
                    onChange={(e) => setStore((prev: any) => prev ? { ...prev, email: e.target.value } : null)}
                    placeholder="support@store.com"
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    }
                />

                <div className="space-y-1">
                    <label className="text-[9px] lg:text-[10px] font-bold text-black uppercase tracking-widest pr-1">رقم الهاتف</label>
                    <div className="flex gap-2" dir="ltr">
                        <div className="w-14 lg:w-16 bg-[#FBFBFF] border border-slate-100 rounded-lg lg:rounded-xl px-2 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-black flex items-center justify-center leading-tight">+964</div>
                        <Input
                            compact
                            containerClassName="flex-1"
                            type="tel"
                            dir="ltr"
                            value={store?.phone || ''}
                            onChange={(e) => setStore((prev: any) => prev ? { ...prev, phone: e.target.value } : null)}
                            placeholder="770 123 4567"
                        />
                    </div>
                </div>

                <Input
                    compact
                    containerClassName="md:col-span-2"
                    label="العنوان (اختياري)"
                    value={store?.address || ''}
                    onChange={(e) => setStore((prev: any) => prev ? { ...prev, address: e.target.value } : null)}
                    placeholder="بغداد، المنصور، شارع الأميرات"
                />
            </div>
        </Card>
    );
}
