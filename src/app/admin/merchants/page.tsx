'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminStores, updateStorePlanAction } from './actions';
import { toast } from 'react-hot-toast';

interface Store {
    id: string;
    name: string;
    merchant_id: string;
    slug: string;
    plan_id: string;
    subscription_type: string;
    plan_started_at: string | null;
    plan_expires_at: string | null;
    created_at: string;
    phone?: string;
    profiles: { full_name: string; phone: string; };
}

const DURATION_OPTIONS = [
    { value: 3, label: '3 أشهر' },
    { value: 6, label: '6 أشهر' },
    { value: 12, label: 'سنة كاملة' },
];

const SUB_TYPES = ['Free', 'Pro', 'Premium'];

function calcExpiry(startDate: string, months: number): string {
    if (!startDate) return '—';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
    if (!expiresAt) return <span className="text-xs text-slate-400">—</span>;
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const label = date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
    const color = diff < 0 ? 'text-rose-600 bg-rose-50' : diff <= 30 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
    const prefix = diff < 0 ? '⚠️ انتهى' : diff <= 30 ? '⏳' : '✅';
    return (
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${color}`}>
            {prefix} {label}
        </div>
    );
}

export default function AdminMerchantsPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    // Plan change modal state
    const [planModal, setPlanModal] = useState<Store | null>(null);
    const [modalMode, setModalMode] = useState<'renew' | 'change'>('renew');
    const [newSubType, setNewSubType] = useState('Pro');
    const [newDuration, setNewDuration] = useState(12);
    const [newStartDate, setNewStartDate] = useState('');
    const [updatingPlan, setUpdatingPlan] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => { fetchStores(); }, []);

    const fetchStores = async () => {
        setLoading(true);
        const data = await getAdminStores();
        setStores(data as any as Store[]);
        setLoading(false);
    };

    const openPlanModal = (store: Store, mode: 'renew' | 'change') => {
        setPlanModal(store);
        setModalMode(mode);
        setNewSubType(store.subscription_type || 'Free');
        setNewDuration(12);

        if (mode === 'renew') {
            // Smart start date: if expired (or no date) → today; if still active → resume from expiry
            const now = new Date();
            const expiresAt = store.plan_expires_at ? new Date(store.plan_expires_at) : null;
            const smartStart = (!expiresAt || expiresAt < now) ? today : expiresAt.toISOString().split('T')[0];
            setNewStartDate(smartStart);
        }
        // For 'change' mode: no start date needed, we keep existing dates
    };

    const handlePlanUpdate = async () => {
        if (!planModal) return;
        setUpdatingPlan(true);

        let startDate: string;
        let durationMonths: number;
        let subType = newSubType;

        if (modalMode === 'change') {
            // Keep existing dates — only change subscription_type
            startDate = planModal.plan_started_at
                ? new Date(planModal.plan_started_at).toISOString().split('T')[0]
                : today;
            // Compute duration from existing dates if available, otherwise default to 12
            if (planModal.plan_started_at && planModal.plan_expires_at) {
                const start = new Date(planModal.plan_started_at);
                const end = new Date(planModal.plan_expires_at);
                const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                durationMonths = Math.max(1, diffMonths);
            } else {
                durationMonths = 12;
            }
        } else {
            // Renew: use the smart start date + chosen duration
            startDate = newStartDate;
            durationMonths = newDuration;
            subType = planModal.subscription_type || 'Free'; // keep existing type on renew
        }

        const result = await updateStorePlanAction(
            planModal.id,
            planModal.plan_id || '',
            subType,
            startDate,
            durationMonths
        );

        if (result.success) {
            const label = modalMode === 'renew' ? 'تم تجديد الاشتراك ✅' : 'تم تحديث الباقة ✅';
            toast.success(label);
            const computedExpiry = (() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + durationMonths);
                return d.toISOString();
            })();
            setStores(prev => prev.map(s => s.id === planModal.id
                ? {
                    ...s,
                    subscription_type: subType,
                    plan_started_at: new Date(startDate).toISOString(),
                    plan_expires_at: computedExpiry
                }
                : s
            ));
            setPlanModal(null);
        } else {
            toast.error(result.error || 'فشل في التحديث');
        }
        setUpdatingPlan(false);
    };

    const expiryPreview = calcExpiry(newStartDate, newDuration);

    return (
        <div className="p-4 lg:p-8 pb-32 lg:pb-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
            {/* Header */}
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
                    إضافة تاجر جديد
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right bg-white min-w-[800px]">
                        <thead className="bg-[#FBFBFF] text-slate-500 text-sm font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-2xl">المتجر والرابط</th>
                                <th className="px-6 py-4">المالك</th>
                                <th className="px-6 py-4">الاتصال</th>
                                <th className="px-6 py-4 text-center">الباقة</th>
                                <th className="px-6 py-4 text-center">تاريخ الانتهاء</th>
                                <th className="px-6 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    </td>
                                </tr>
                            ) : stores.map((store) => (
                                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black border border-indigo-100">
                                                {store.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{store.name}</div>
                                                <a href={`/shop/${store.slug}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 font-mono hover:underline">
                                                    /shop/{store.slug}
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{store.profiles.full_name}</div>
                                        <div className="text-xs text-slate-400 font-mono">#{store.merchant_id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-600 font-mono text-sm" dir="ltr">
                                            {store.profiles.phone || '—'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${store.subscription_type === 'Premium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            store.subscription_type === 'Pro' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {store.subscription_type || 'Free'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <ExpiryBadge expiresAt={store.plan_expires_at} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openPlanModal(store, 'renew')}
                                                className="px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 active:scale-95"
                                            >
                                                🔄 تجديد
                                            </button>
                                            <button
                                                onClick={() => openPlanModal(store, 'change')}
                                                className="px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 active:scale-95"
                                            >
                                                ✏️ تغيير
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && stores.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        لا توجد متاجر في المنصة حتى الآن
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Plan Change Modal */}
            {planModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPlanModal(null)} />
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl">
                        <div className="p-6 border-b border-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {modalMode === 'renew' ? '🔄 تجديد الاشتراك' : '✏️ تغيير الباقة'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                متجر: <span className="font-bold text-slate-600">{planModal.name}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Current expiry info */}
                            {planModal.plan_expires_at && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الاشتراك الحالي ينتهي</div>
                                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                                            {new Date(planModal.plan_expires_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sub type — only shown when changing plan */}
                            {modalMode === 'change' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">الباقة الجديدة</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SUB_TYPES.map(t => (
                                            <button key={t} type="button" onClick={() => setNewSubType(t)}
                                                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${newSubType === t
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-200'
                                                    }`}
                                            >
                                                {t === 'Free' ? 'مجاني' : t === 'Pro' ? 'احترافي' : 'متميز'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Duration + Date — only for renew */}
                            {modalMode === 'renew' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">مدة التجديد</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {DURATION_OPTIONS.map(opt => (
                                                <button key={opt.value} type="button" onClick={() => setNewDuration(opt.value)}
                                                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${newDuration === opt.value
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-200'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">يبدأ من</label>
                                            <input
                                                type="date" value={newStartDate}
                                                onChange={e => setNewStartDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ينتهي في</label>
                                            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-emerald-700 font-bold text-xs">{expiryPreview}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Change mode: confirm existing dates are preserved */}
                            {modalMode === 'change' && planModal.plan_expires_at && (
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs font-bold text-indigo-600">
                                        سيتم الحفاظ على تاريخ الانتهاء الحالي: {new Date(planModal.plan_expires_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-50 flex gap-3">
                            <button
                                onClick={() => setPlanModal(null)}
                                className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handlePlanUpdate}
                                disabled={updatingPlan || !newStartDate}
                                className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {updatingPlan ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : 'تأكيد التحديث'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
