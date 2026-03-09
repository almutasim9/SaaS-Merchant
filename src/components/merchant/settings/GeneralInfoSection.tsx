'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface GeneralInfoSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    savingLogo: boolean;
}

export function GeneralInfoSection({
    store,
    setStore,
    saving,
    onSave,
    onLogoUpload,
    savingLogo
}: GeneralInfoSectionProps) {
    return (
        <Card
            title="المعلومات العامة"
            subtitle="اسم المتجر والوصف والشعار"
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            headerAction={
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="flex flex-col-reverse lg:flex-row items-center lg:items-start gap-10 lg:gap-20">
                <div className="w-full flex-1 space-y-6 lg:space-y-8">
                    <Input
                        label="اسم المتجر"
                        value={store?.name || ''}
                        onChange={(e) => setStore((prev: any) => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="مثال: متجر علي للأزياء"
                    />
                    <Textarea
                        label="وصف المتجر (اختياري)"
                        rows={4}
                        value={store?.description || ''}
                        onChange={(e) => setStore((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="أفضل متجر لبيع الملابس العصرية..."
                    />
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
                                onChange={onLogoUpload}
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
        </Card>
    );
}
