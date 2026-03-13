'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import arTranslations from '@/locales/ar.json';
import enTranslations from '@/locales/en.json';
import kuTranslations from '@/locales/ku.json';

export type Language = 'ar' | 'en' | 'ku';

const translations: Record<Language, Record<string, string>> = {
    ar: arTranslations,
    en: enTranslations,
    ku: kuTranslations,
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, storageKey = 'app_lang' }: { children: ReactNode; storageKey?: string }) {
    const [language, setLanguageState] = useState<Language>('ar');

    useEffect(() => {
        // Load language from storage if available
        const savedLang = localStorage.getItem(storageKey) as Language;
        if (savedLang && ['ar', 'en', 'ku'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, [storageKey]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(storageKey, lang);
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['ar'][key] || key;
    };

    const dir = language === 'en' ? 'ltr' : 'rtl';

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
            <div dir={dir} className={language === 'en' ? 'font-sans' : 'font-cairo'}>
                {children}
            </div>
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
