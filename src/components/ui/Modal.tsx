'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    variant?: 'default' | 'danger' | 'amber';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    variant = 'default',
    maxWidth = 'md'
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidths = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    const iconVariants = {
        default: (
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        ),
        danger: (
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
        ),
        amber: (
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
        ),
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className={cn(
                "relative bg-white rounded-[2.5rem] shadow-2xl p-8 w-full animate-in zoom-in-95 duration-300",
                maxWidths[maxWidth]
            )}>
                <div className="text-center space-y-4 mb-8">
                    <div className="flex justify-center">{iconVariants[variant]}</div>
                    <h3 className="text-xl lg:text-2xl font-black text-slate-800">{title}</h3>
                </div>

                <div className="relative">
                    {children}
                </div>

                {footer && (
                    <div className="mt-8 flex gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
