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
}

export function Card({
    children,
    title,
    subtitle,
    icon,
    headerAction,
    className,
    headerClassName,
    contentClassName
}: CardProps) {
    return (
        <div className={cn(
            "bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden",
            className
        )}>
            {(title || icon || headerAction) && (
                <div className={cn("p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between", headerClassName)}>
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 text-slate-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h3 className="text-lg lg:text-xl font-bold text-slate-800">{title}</h3>}
                            {subtitle && <p className="text-slate-400 text-[10px] lg:text-xs font-medium">{subtitle}</p>}
                        </div>
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className={cn("p-6 lg:p-10", contentClassName)}>
                {children}
            </div>
        </div>
    );
}
