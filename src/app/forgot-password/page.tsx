'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from '@/app/actions/auth-reset';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const res = await sendPasswordResetEmail(email);
            if (res.success) {
                setSuccess(true);
            } else {
                setErrorMsg(res.error || 'حدث خطأ، يرجى المحاولة لاحقاً');
            }
        } catch (err) {
            setErrorMsg('حدث خطأ غير متوقع.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8" dir="rtl">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">استعادة كلمة المرور</h1>
                    <p className="text-sm font-bold text-slate-400 mt-2">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين</p>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">تفقد بريدك الإلكتروني</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                                    لقد أرسلنا رابط إعادة التعيين إلى<br />
                                    <span className="font-bold text-indigo-600" dir="ltr">{email}</span>
                                </p>
                            </div>
                            <Link href="/login" className="block w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                                العودة لتسجيل الدخول
                            </Link>
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 text-left focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                    dir="ltr"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'إرسال رابط الاستعادة'
                                )}
                            </button>

                            <p className="text-center mt-6 text-sm font-bold text-slate-400">
                                تذكرت كلمة المرور؟ <Link href="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors">تسجيل الدخول</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
