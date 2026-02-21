'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminStores } from './actions';

// Types
interface Store {
    id: string;
    name: string;
    merchant_id: string;
    slug: string;
    created_at: string;
    phone?: string;
    profiles: {
        full_name: string;
        phone: string;
    }
}

export default function AdminMerchantsPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        const data = await getAdminStores();
        setStores(data as any as Store[]);
        setLoading(false);
    };

    const handleSuspendToggle = async (storeId: string, currentStatus: boolean) => {
        // Here we can either suspend the Store or the Profile. For SaaS platforms, 
        // a simple way is to add an `is_active` boolean to the `stores` table 
        // to instantly block the checkout and merchant dashboard.

        alert('ميزة الإيقاف سيتم تفعيلها برمجياً في التحديث القادم بعد إضافة حقل is_active لقاعدة البيانات.');
    };

    return (
        <div className="p-8 pb-32 lg:pb-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة التجار والمتاجر</h1>
                    <p className="text-slate-500 mt-2 font-medium">قائمة بجميع المشتركين مع تحكم بصلاحيات متاجرهم.</p>
                </div>
                <Link
                    href="/admin/add-merchant"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all text-sm"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>إضافة تاجر جديد</span>
                </Link>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Search Bar (Optional) */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث عن متجر، تاجر، أو رقم هاتف..."
                            className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block pr-12 p-3.5 transition-all"
                            disabled
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right bg-white min-w-[800px]">
                        <thead className="bg-[#FBFBFF] text-slate-500 text-sm font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-2xl">المتجر والرابط</th>
                                <th className="px-6 py-4">المالك (التاجر)</th>
                                <th className="px-6 py-4">معلومات الاتصال</th>
                                <th className="px-6 py-4 text-center">الحالة والإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : stores.map((store) => (
                                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {store.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-base">{store.name}</div>
                                                <a href={`/shop/${store.slug}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 font-medium font-mono hover:text-indigo-600 hover:underline mt-1 block">
                                                    /shop/{store.slug}
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{store.profiles.full_name}</div>
                                        <div className="text-xs text-slate-400 mt-1 font-mono">ID: {store.merchant_id.substring(0, 6)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-600 font-mono" dir="ltr">
                                            {store.profiles.phone || 'غير مدرج'}
                                        </div>
                                        {store.phone && store.phone !== store.profiles.phone && (
                                            <div className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">المتجر: {store.phone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3 w-full">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">نشط</span>

                                            <button
                                                onClick={() => handleSuspendToggle(store.id, true)}
                                                className="px-4 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                إيقاف
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && stores.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">لا توجد متاجر في المنصة حتى الآن</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
