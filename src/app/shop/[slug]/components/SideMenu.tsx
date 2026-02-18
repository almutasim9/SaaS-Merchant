'use client';

import React from 'react';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: 'home' | 'categories') => void;
    storeName: string;
}

export default function SideMenu({ isOpen, onClose, onNavigate, storeName }: SideMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-end font-sans" dir="rtl">
            {/* Backdrop with deeper blur */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            ></div>

            {/* Menu Content - Premium Glassmorphism */}
            <div className="relative w-[320px] h-full bg-white/95 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 overflow-y-auto border-l border-white/20">
                <div className="p-10 space-y-12">
                    {/* Header Refinement */}
                    <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.25rem] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
                                {storeName[0]}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 leading-tight">{storeName}</h2>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">المتجر الرسمي</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100/50 hover:bg-slate-100 rounded-xl transition-all active:scale-90">
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation - Modern Interactive List */}
                    <nav className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">التنقل السريع</h4>
                        <button
                            onClick={() => { onNavigate('home'); onClose(); }}
                            className="w-full flex items-center justify-between p-4 hover:bg-emerald-50/50 rounded-2xl transition-all group border border-transparent hover:border-emerald-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white shadow-sm group-hover:shadow-md rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">الصفحة الرئيسية</span>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </nav>

                    {/* About Us Card - Premium Stylization */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">قصتنا</h4>
                        <div className="relative p-6 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/10 overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
                            <p className="text-[11px] font-bold leading-relaxed opacity-90">
                                نحن في <span className="text-emerald-400 font-bold">{storeName}</span> نسعى لتقدیم أرقی المنتجات بأعلى معایير الجودة. هدفنا هو توفیر تجربة تسوق فریده وممیزة لكل عملائنا في جمیع أنحاء العراق. ثقتكم هي سر نجاحنا وتطورنا المستمر.
                            </p>
                        </div>
                    </div>

                    {/* Contact & Socials - Structured Grid */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-700">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">تواصل معنا</h4>

                        <div className="space-y-5 px-2">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-500/5">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">الموقع الجغرافي</span>
                                    <span className="text-xs font-bold text-slate-800 leading-tight block">العراق، بغداد، الكرادة، <br />شارع 62 المتميز</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <a href="#" className="flex-1 h-12 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center gap-2 border border-[#25D366]/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.52s.297.176.706.422c1.455.872 3.13 1.332 4.846 1.332 5.094 0 9.239-4.145 9.241-9.24 0-2.469-.962-4.789-2.708-6.536-1.747-1.748-4.068-2.71-6.537-2.71-5.093 0-9.239 4.145-9.241 9.24 0 2.117.561 4.128 1.624 5.922l-.18-.32-1.097 4.008 4.126-1.078zm11.367-6.429c-.066-.11-.242-.176-.506-.308-.264-.132-1.562-.771-1.803-.859-.242-.088-.418-.132-.594.132-.176.264-.682.859-.836 1.035-.154.176-.308.198-.573.066-.264-.132-1.115-.411-2.123-1.312-.784-.699-1.314-1.564-1.468-1.828-.154-.264-.016-.407.116-.539.118-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.594-1.432-.814-1.961-.214-.518-.432-.446-.594-.454-.154-.007-.33-.008-.506-.008-.176 0-.462.066-.704.33-.242.264-.925.903-.925 2.2 0 1.297.947 2.552 1.079 2.728.132.176 1.865 2.848 4.516 3.993.631.272 1.123.435 1.508.558.633.201 1.21.173 1.665.105.508-.076 1.562-.638 1.782-1.254.22-.616.22-1.144.154-1.254z" />
                                    </svg>
                                    <span className="text-[11px] font-bold">وتساب</span>
                                </a>
                                <a href="#" className="flex-1 h-12 bg-[#E1306C]/5 hover:bg-[#E1306C]/10 text-[#E1306C] rounded-2xl flex items-center justify-center gap-2 border border-[#E1306C]/10 transition-all hover:scale-[1.02] active:scale-95">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.848 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                    <span className="text-[11px] font-bold">إنستغرام</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Styled Footer Element */}
                <div className="mt-auto p-10 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">All rights reserved</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">©️ 2026 {storeName}</span>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
