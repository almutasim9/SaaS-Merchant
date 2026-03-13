'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
    containerClassName?: string;
    compact?: boolean;
}

export function Input({
    label,
    icon,
    error,
    className,
    containerClassName,
    compact,
    ...props
}: InputProps) {
    return (
        <div className={cn(compact ? "space-y-1" : "space-y-3", containerClassName)}>
            {label && (
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={cn(
                        "w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all leading-tight",
                        compact && "py-2 lg:py-2.5 px-4 lg:px-5 lg:rounded-xl",
                        icon && (compact ? "pl-10 lg:pl-12" : "pl-12 lg:pl-14"),
                        error && "border-rose-300 focus:ring-rose-100",
                        className
                    )}
                    {...props}
                />
                {icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                        {icon}
                    </div>
                )}
            </div>
            {error && <p className="text-[10px] font-bold text-rose-500 pr-1">{error}</p>}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
    compact?: boolean;
}

export function Textarea({
    label,
    error,
    className,
    containerClassName,
    compact,
    ...props
}: TextareaProps) {
    return (
        <div className={cn(compact ? "space-y-1" : "space-y-3", containerClassName)}>
            {label && (
                <label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest pr-1">
                    {label}
                </label>
            )}
            <textarea
                className={cn(
                    "w-full bg-[#FBFBFF] border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3.5 lg:py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none leading-tight",
                    compact && "py-2.5 lg:py-3 px-4 lg:px-5 lg:rounded-xl",
                    error && "border-rose-300 focus:ring-rose-100",
                    className
                )}
                {...props}
            />
            {error && <p className="text-[10px] font-bold text-rose-500 pr-1">{error}</p>}
        </div>
    );
}
