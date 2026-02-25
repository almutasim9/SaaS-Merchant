'use client';

import React from 'react';

interface FloatingCartProps {
    totalItems: number;
    onClick: () => void;
}

export default function FloatingCart({ totalItems, onClick }: FloatingCartProps) {
    if (totalItems === 0) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-8 left-8 z-[150] w-16 h-16 bg-[var(--theme-primary)] text-white rounded-full flex items-center justify-center shadow-2xl shadow-sm hover:scale-110 active:scale-95 transition-all animate-in zoom-in slide-in-from-bottom-10 duration-500 group"
        >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full border-2 border-white shadow-lg group-hover:rotate-12 transition-transform">
                {totalItems}
            </span>
        </button>
    );
}
