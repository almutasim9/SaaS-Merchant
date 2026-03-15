'use client';

import { useState } from 'react';

export default function PlatformSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Mocks initial data
    const [formData, setFormData] = useState({
        whatsapp: '+9647703854913',
        phone: '+9647703854913',
        email: 'info@tajirzone.com',
        facebook: 'TajirZone',
        instagram: 'TajirZone',
        platformNameAr: 'تاجِر زون',
        platformNameEn: 'TajirZone',
        trustedBrands: 'شركة الموصل التقنية, أزياء بغداد, أربيل ديجيتال, بصرة لوجستكس',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        // Simulate API call for saving settings
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setLoading(false);
        setSuccess(true);
        
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="p-8 pb-32 lg:pb-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans" dir="rtl">
            <div>
                <h1 className="text-3xl font-black text-black tracking-tight">إعدادات المنصة</h1>
                <p className="text-black mt-2 font-medium">إدارة معلومات التواصل والروابط وتفاصيل المنصة الأساسية الخاصة بك.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                
                {/* Contact Section */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        معلومات التواصل الأساسية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">رقم الواتساب</label>
                            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">رقم الهاتف (للاتصال)</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">البريد الإلكتروني الرسمي</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M12 18v-6m0 0l-3 3m3-3l3 3" />
                        </svg>
                        الروابط والشبكات الاجتماعية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">رابط صفحة فيسبوك</label>
                            <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">حساب الانستجرام</label>
                            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                    </div>
                </div>

                {/* Brand Settings */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        تخصيص الهوية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">اسم المنصة (عربي)</label>
                            <input type="text" name="platformNameAr" value={formData.platformNameAr} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-black">اسم المنصة (إنجليزي)</label>
                            <input type="text" name="platformNameEn" value={formData.platformNameEn} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" dir="ltr" />
                        </div>
                    </div>
                </div>

                {/* Trusted Brands Settings */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        قائمة العلامات الموثوقة (الصفحة الرئيسية)
                    </h2>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-black">أسماء العلامات التجارية (مفصولة بفاصلة)</label>
                        <input type="text" name="trustedBrands" value={formData.trustedBrands} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" placeholder="مثال: متجر أحمد, بوتيك بغداد, ..." />
                        <p className="text-[11px] text-black">ستظهر هذه القائمة بشكل متحرك في قسم الـ Hero على الصفحة الرئيسية لإعطاء انطباع بالثقة.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    {success && <span className="text-emerald-500 font-bold text-sm self-center">تم الحفظ بنجاح! يمكن ربطها بقاعدة البيانات لاحقاً.</span>}
                    <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        حفظ التغييرات
                    </button>
                </div>
            </form>
        </div>
    );
}
