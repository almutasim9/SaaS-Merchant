'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
    label?: string;
    description?: string;
    badge?: string;
    variant?: 'indigo' | 'amber' | 'emerald';
}

export function Toggle({
    enabled,
    onChange,
    disabled = false,
    label,
    description,
    badge,
    variant = 'indigo'
}: ToggleProps) {
    const variants = {
        indigo: 'bg-indigo-600',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-600',
    };

    return (
        <div className={cn(
            "flex items-center justify-between p-4 lg:p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all",
            disabled && "opacity-50"
        )}>
            <div className="flex-1 ml-4 text-right">
                <div className="flex items-center gap-2 mb-1 justify-end">
                    {badge && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-200">
                            {badge}
                        </span>
                    )}
                    {label && <h4 className="font-bold text-slate-800">{label}</h4>}
                </div>
                {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(!enabled)}
                className={cn(
                    "relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                    enabled ? variants[variant] : "bg-slate-300",
                    !disabled ? "cursor-pointer focus:ring-indigo-600" : "cursor-not-allowed"
                )}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        enabled ? "-translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    );
}
