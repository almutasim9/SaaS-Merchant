'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { sendTestNotificationAction } from '@/app/merchant/settings/actions';
import { Bell, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';

interface NotificationDebugSectionProps {
    storeId: string;
}

export function NotificationDebugSection({ storeId }: NotificationDebugSectionProps) {
    const [loading, setLoading] = useState(false);

    const handleSendTest = async () => {
        setLoading(true);
        try {
            const result = await sendTestNotificationAction(storeId);
            if (result.success) {
                toast.success(`تم إرسال الإشعار بنجاح! وصل إلى ${result.sentCount} أجهزة. ✅`);
            } else {
                toast.error(result.error || 'فشل في إرسال الإشعار التجريبي');
            }
        } catch (err: any) {
            toast.error('خطأ غير متوقع: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-slate-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-black">نظام الإشعارات</h2>
                            <p className="text-black text-sm font-medium mt-1">تأكد من عمل نظام التنبيهات الفورية على أجهزتك</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-black mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-black">تفعيل الإذن</h4>
                                <p className="text-xs text-black mt-1 leading-relaxed">يجب السماح بالإشعارات في المتصفح أولاً لكي يستطيع النظام إرسال التنبيهات.</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-black mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-black">تطبيق PWA</h4>
                                <p className="text-xs text-black mt-1 leading-relaxed">على آيفون وأندرويد، يفضل إضافة الموقع للشاشة الرئيسية لضمان وصول الإشعارات في الخلفية.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-72 flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={handleSendTest}
                        loading={loading}
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                    >
                        إرسال إشعار تجريبي 🔔
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-black font-bold uppercase tracking-wider bg-slate-50 py-2 rounded-xl border border-slate-100">
                        <Terminal className="w-3 h-3" />
                        <span>Firebase Notification Debug</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
