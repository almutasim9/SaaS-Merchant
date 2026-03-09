'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface StoreURLSectionProps {
    store: any;
    setStore: (store: any) => void;
    slugEditing: boolean;
    setSlugEditing: (editing: boolean) => void;
    newSlug: string;
    setNewSlug: (slug: string) => void;
    onSaveClick: () => void;
    onCancel: () => void;
    plan: any;
}

export function StoreURLSection({
    store,
    setStore,
    slugEditing,
    setSlugEditing,
    newSlug,
    setNewSlug,
    onSaveClick,
    onCancel,
    plan
}: StoreURLSectionProps) {
    return (
        <Card
            title="رابط المتجر (URL)"
            subtitle='الرابط الذي يصل به العملاء لمتجرك. يمكنك تغييره <span class="text-amber-600 font-bold">مرة واحدة فقط</span>.'
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            }
        >
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
                            <Button variant="amber" onClick={onSaveClick}>تأكيد التغيير</Button>
                            <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        onClick={() => { setSlugEditing(true); setNewSlug(store?.slug || ''); }}
                        leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                    >
                        تعديل الرابط (مرة واحدة)
                    </Button>
                )}
            </div>
        </Card>
    );
}
