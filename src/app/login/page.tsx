'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                // Translate specific Supabase errors
                if (authError.message === 'Invalid login credentials') {
                    throw new Error('بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.');
                }
                throw authError;
            }

            if (authData.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    setError('حدث خطأ أثناء تحميل بيانات الحساب.');
                    setLoading(false);
                    return;
                }

                if (profile) {
                    setSuccess(true);
                    const role = profile.role;

                    // Small delay to show success message before redirecting
                    setTimeout(() => {
                        if (role === 'super_admin') {
                            window.location.href = '/admin/dashboard';
                        } else if (role === 'merchant') {
                            window.location.href = '/merchant/dashboard';
                        } else {
                            setError('رتبة المستخدم غير معروفة. يرجى التواصل مع الدعم الفني.');
                            setSuccess(false);
                            setLoading(false);
                        }
                    }, 1500);
                } else {
                    setError('لم يتم العثور على ملف شخصي لهذه البيانات.');
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مرة أخرى.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 selection:bg-indigo-100 font-sans" dir="rtl">
            <div className="w-full max-w-[480px]">
                {/* Logo & Header */}
                <div className="text-center mb-10 space-y-4">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30 group-hover:scale-110 transition-all duration-500">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3L4 9V21H20V9L12 3ZM12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11Z" />
                            </svg>
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">دخول المنصة</h1>
                        <p className="text-slate-400 font-medium text-[10px] uppercase tracking-[0.3em] mt-2">SaaS Merchant Platform</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-indigo-600/5 relative overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-[60px] -z-0 translate-x-10 -translate-y-10 group-hover:bg-indigo-100/50 transition-all duration-700"></div>

                    <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                                        placeholder="your@email.com"
                                    />
                                    <svg className="w-5 h-5 text-slate-200 absolute left-6 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">كلمة المرور</label>
                                    <button type="button" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">نسيت كلمة المرور؟</button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                    <svg className="w-5 h-5 text-slate-200 absolute left-6 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-bold p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                تم تسجيل دخولك بنجاح. جارٍ التحويل...
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm group/btn overflow-hidden relative"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>تسجيل الدخول</span>
                                    <svg className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-10 text-center space-y-6">
                    <p className="text-xs font-bold text-slate-400">
                        ليس لديك حساب؟ <Link href="/#pricing" className="text-indigo-600 hover:underline">ابدأ الآن مجاناً</Link>
                    </p>
                    <div className="pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] leading-relaxed">
                            © 2026 SaaS-Plus Platform <br />
                            جميع الحقوق محفوظة لنظام إدارة التجار
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
