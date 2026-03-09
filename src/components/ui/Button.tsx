'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'amber' | 'emerald' | 'cyan';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20',
        secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200/20',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-50',
        amber: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20',
        emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20',
        cyan: 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-600/20',
    };

    const sizes = {
        sm: 'px-4 py-2 text-[10px]',
        md: 'px-6 py-3 text-xs',
        lg: 'px-8 py-4 text-sm',
    };

    return (
        <button
            disabled={disabled || loading}
            className={cn(
                'relative flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {!loading && leftIcon && <span className="opacity-90">{leftIcon}</span>}
            <span className={cn(loading && 'opacity-0')}>{children}</span>
            {!loading && rightIcon && <span className="opacity-90">{rightIcon}</span>}
        </button>
    );
}
