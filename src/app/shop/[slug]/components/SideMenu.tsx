'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: 'home' | 'about' | 'contact') => void;
    storeName: string;
    storeLogo?: string;
    activeView?: string;
}

export default function SideMenu({ isOpen, onClose, onNavigate, storeName, storeLogo, activeView = 'home' }: SideMenuProps) {
    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const navItems = [
        {
            id: 'home', label: 'الرئيسية', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            id: 'about', label: 'من نحن', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'contact', label: 'تواصل معنا', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            )
        },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Menu Panel */}
            <div
                className={`fixed top-0 right-0 w-[300px] h-full bg-white z-[201] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-2">
                    {/* Logo */}
                    {storeLogo ? (
                        <div className="w-12 h-12 rounded-xl bg-[#00D084] flex items-center justify-center overflow-hidden shadow-sm shadow-emerald-200">
                            <Image src={storeLogo} alt={storeName} width={48} height={48} className="object-cover rounded-xl" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#00D084] flex items-center justify-center shadow-sm shadow-emerald-200">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    )}

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Welcome */}
                <div className="px-5 pt-2 pb-6 text-right">
                    <p className="text-sm text-slate-400">أهلاً بك في متجرنا</p>
                    <h2 className="text-xl font-bold text-slate-800">تسوق ممتع</h2>
                </div>

                {/* Navigation */}
                <nav className="px-4 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-all text-right ${activeView === item.id
                                    ? 'bg-[#E8FFF4] text-[#00B870] font-bold'
                                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                                }`}
                        >
                            <span className={activeView === item.id ? 'text-[#00D084]' : 'text-slate-400'}>
                                {item.icon}
                            </span>
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">Version 1.0.0</p>
                </div>
            </div>
        </>
    );
}
