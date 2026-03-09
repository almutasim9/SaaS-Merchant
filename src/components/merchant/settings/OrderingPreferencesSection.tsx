'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface OrderingPreferencesSectionProps {
    store: any;
    setStore: (store: any) => void;
    saving: boolean;
    onSave: () => void;
    plan: any;
}

export function OrderingPreferencesSection({
    store,
    setStore,
    saving,
    onSave,
    plan
}: OrderingPreferencesSectionProps) {
    return (
        <Card
            title="خيارات استقبال الطلبات"
            subtitle="التحكم في تفعيل سلة المشتريات وخيارات التوصيل والاستلام"
            icon={
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            }
            headerAction={
                <Button loading={saving} onClick={onSave} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>
                    حفظ
                </Button>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                <Toggle
                    label="استقبال الطلبات (سلة المشتريات)"
                    description='عند الإغلاق، سيتحول متجرك إلى "كتالوج" لاستعراض المنتجات فقط دون إمكانية الطلب.'
                    badge={!plan.allow_order_reception_options ? "ميزة حصرية للذهبي" : undefined}
                    enabled={!!store?.accepts_orders}
                    disabled={!plan.allow_order_reception_options}
                    onChange={(val) => {
                        if (plan.allow_order_reception_options) {
                            setStore((prev: any) => prev ? { ...prev, accepts_orders: val } : null);
                        } else {
                            toast.error('إيقاف الطلبات متاح فقط للباقة الذهبية.');
                        }
                    }}
                />

                <div className={!store?.accepts_orders ? 'opacity-50 pointer-events-none' : ''}>
                    <Toggle
                        label="توفير خدمة التوصيل (دليفري) 🚚"
                        description="السماح للعملاء بطلب توصيل المشتريات إلى عناوينهم."
                        enabled={!!store?.offers_delivery}
                        disabled={!plan.allow_order_reception_options}
                        onChange={(val) => {
                            if (plan.allow_order_reception_options) {
                                setStore((prev: any) => prev ? { ...prev, offers_delivery: val } : null);
                            } else {
                                toast.error('أنت تستخدم الإعدادات الافتراضية للطلب. خيارات التوصيل حصرية للباقة الذهبية.');
                            }
                        }}
                    />
                </div>

                <div className={!store?.accepts_orders ? 'opacity-50 pointer-events-none' : ''}>
                    <Toggle
                        label="توفير الاستلام من الفرع (Pickup) 🛍️"
                        description="السماح للعملاء بالطلب واستلام المشتريات بأنفسهم من المتجر."
                        enabled={!!store?.offers_pickup}
                        disabled={!plan.allow_order_reception_options}
                        onChange={(val) => {
                            if (plan.allow_order_reception_options) {
                                setStore((prev: any) => prev ? { ...prev, offers_pickup: val } : null);
                            } else {
                                toast.error('أنت تستخدم الإعدادات الافتراضية للطلب. خيارات الاستلام حصرية للباقة الذهبية.');
                            }
                        }}
                    />
                    {!store?.address && store?.offers_pickup && (
                        <p className="text-xs text-amber-600 font-bold mt-2">⚠️ يرجى التأكد من كتابة عنوان المتجر أدناه ليتمكن العملاء من الاستدلال عليه.</p>
                    )}
                </div>

                {store?.accepts_orders && !store?.offers_delivery && !store?.offers_pickup && (
                    <div className="p-4 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        يجب إتاحة خيار واحد على الأقل (نوصيل أو استلام) للسماح للعملاء بالطلب.
                    </div>
                )}
            </div>
        </Card>
    );
}
