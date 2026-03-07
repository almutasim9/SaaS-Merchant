'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '@/app/actions/auth-reset';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        // Supabase needs a moment to parse the #access_token from the URL hash.
        // We listen for the auth state change to verify the recovery session.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setCheckingSession(false);
                setErrorMsg('');
            }
        });

        // Check if there is already a session that didn't trigger an event
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setCheckingSession(false);
            } else {
                // If after 2 seconds no session or event was found, show error.
                // It means the user navigated here without a valid link.
                setTimeout(() => {
                    setCheckingSession((prev) => {
                        if (prev) {
                            setErrorMsg('لا يوجد طلب استعادة صالح أو انتهت صلاحية الرابط. يرجى طلب رابط جديد.');
                            return false;
                        }
                        return prev;
                    });
                }, 2000);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('كلمات المرور غير متطابقة!');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }

        setLoading(true);

        try {
            const res = await updatePasswordAction(newPassword);
            if (res.success) {
                setSuccess(true);
                // Optionally log them out so they test the fresh password, or let them redirect to dashboard
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setErrorMsg(res.error || 'حدث خطأ غير متوقع.');
            }
        } catch (err) {
            setErrorMsg('حدث خطأ أثناء الاتصال بالخادم.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8" dir="rtl">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">تعيين كلمة مرور جديدة</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2">اختر كلمة مرور قوية وآمنة لمتجرك</p>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">تم التحديث بنجاح!</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">
                                    لقد تم تغيير كلمة المرور الخاصة بك. سيتم توجيهك لتسجيل الدخول...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errorMsg && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-sm font-bold">{errorMsg}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تأكيد كلمة المرور</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword || !!errorMsg.includes('لا يوجد طلب')}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'حفظ كلمة المرور'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
