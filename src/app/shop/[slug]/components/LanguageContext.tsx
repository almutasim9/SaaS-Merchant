'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import arTranslations from '@/locales/ar.json';
import enTranslations from '@/locales/en.json';
import kuTranslations from '@/locales/ku.json';

type Language = 'ar' | 'en' | 'ku';

const translations: Record<Language, Record<string, string>> = {
    ar: arTranslations,
    en: enTranslations,
    ku: kuTranslations,
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar');

    useEffect(() => {
        // Load language from storage if available
        const savedLang = localStorage.getItem('storefront_lang') as Language;
        if (savedLang && ['ar', 'en', 'ku'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('storefront_lang', lang);
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['ar'][key] || key;
    };

    const dir = language === 'en' ? 'ltr' : 'rtl';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            <div dir={dir} className={language === 'en' ? 'font-sans' : 'font-cairo'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
