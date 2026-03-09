'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SocialLinksSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
}

export function SocialLinksSection({
    store,
    setStore,
    saving,
    onSave
}: SocialLinksSectionProps) {
    if (store?.subscription_plans?.allow_social_links === false) return null;

    return (
        <Card
            title="روابط التواصل الاجتماعي"
            subtitle="ستظهر كأيقونات في واجهة المتجر."
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            }
            headerAction={
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 lg:gap-y-8">
                {/* WhatsApp */}
                <div className="space-y-3">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رقم الواتساب</label>
                    <div className="relative" dir="ltr">
                        <input type="tel" value={store?.social_links?.whatsapp || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, social_links: { ...prev.social_links, whatsapp: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all text-left" placeholder="9647XXXXXXXX" dir="ltr" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.559.925 3.328 1.413 5.127 1.414 5.564 0 10.091-4.527 10.093-10.091 0-2.693-1.05-5.228-2.955-7.134-1.905-1.906-4.44-2.956-7.134-2.957-5.564 0-10.09 4.526-10.093 10.091 0 1.782.47 3.522 1.36 5.068l-.893 3.255 3.492-.916z" /></svg>
                        </div>
                    </div>
                </div>
                {/* Instagram */}
                <div className="space-y-3">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب انستغرام</label>
                    <div className="relative" dir="ltr">
                        <input type="text" value={store?.social_links?.instagram || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, social_links: { ...prev.social_links, instagram: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all text-left" placeholder="your_handle" dir="ltr" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        </div>
                    </div>
                </div>
                {/* TikTok */}
                <div className="space-y-3">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">حساب تيك توك</label>
                    <div className="relative" dir="ltr">
                        <input type="text" value={store?.social_links?.tiktok || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, social_links: { ...prev.social_links, tiktok: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-left" placeholder="your_handle" dir="ltr" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.6 8.6 0 01-1.87-1.41v8.74c0 1.39-.3 2.8-.91 4.05a7.8 7.8 0 01-2.49 3.01c-1.25.86-2.73 1.36-4.24 1.47-1.52.11-3.08-.1-4.49-.69a7.8 7.8 0 01-3.23-2.58A7.8 7.8 0 010 13.9c.01-1.39.29-2.8.91-4.05a7.8 7.8 0 012.49-3.01c1.25-.86 2.73-1.36 4.24-1.47 1.52-.11 3.08.1 4.49.69.21.09.41.19.61.3V1.52c-.01-.5-.01-1 0-1.5z" /></svg>
                        </div>
                    </div>
                </div>
                {/* Facebook */}
                <div className="space-y-3">
                    <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">رابط فيسبوك</label>
                    <div className="relative" dir="ltr">
                        <input type="text" value={store?.social_links?.facebook || ''} onChange={(e) => setStore((prev: any) => prev ? { ...prev, social_links: { ...prev.social_links, facebook: e.target.value } } : null)} className="w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-5 lg:pr-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-left" placeholder="facebook.com/your-store" dir="ltr" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
