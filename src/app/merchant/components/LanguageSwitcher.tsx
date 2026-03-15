'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n, Language } from '@/components/providers/I18nProvider';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: 'ar', label: 'العربية', flag: '🇮🇶' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'ku', label: 'کوردی', flag: '☀️' },
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
                <span className="text-lg">{currentLang.flag}</span>
                <span className="text-xs font-bold text-black hidden sm:block">{currentLang.label}</span>
                <svg className={`w-4 h-4 text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all hover:bg-slate-50 ${language === lang.code ? 'text-black bg-indigo-50/50' : 'text-black'
                                    }`}
                            >
                                <span className="text-base">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
