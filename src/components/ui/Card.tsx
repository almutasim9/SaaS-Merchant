'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    headerAction?: React.ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    compact?: boolean;
}

export function Card({
    children,
    title,
    subtitle,
    icon,
    headerAction,
    className,
    headerClassName,
    contentClassName,
    compact
}: CardProps) {
    return (
        <div className={cn(
            "bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden",
            className
        )}>
            {(title || icon || headerAction) && (
                <div className={cn(
                    compact ? "p-3.5 lg:p-4" : "p-6 lg:p-8",
                    "border-b border-slate-50 flex items-center justify-between", 
                    headerClassName
                )}>
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className={cn(
                                compact ? "w-7 h-7 lg:w-8 lg:h-8" : "w-10 h-10 lg:w-12 lg:h-12",
                                "bg-slate-50 text-black rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
                            )}>
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h3 className={cn(compact ? "text-sm lg:text-base" : "text-lg lg:text-xl", "font-bold text-black")}>{title}</h3>}
                            {subtitle && <p className="text-black text-[9px] lg:text-[10px] font-medium">{subtitle}</p>}
                        </div>
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className={cn(compact ? "p-3.5 lg:p-5" : "p-6 lg:p-10", contentClassName)}>
                {children}
            </div>
        </div>
    );
}
