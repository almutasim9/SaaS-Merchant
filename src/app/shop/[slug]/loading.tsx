'use client';

export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans animate-pulse" dir="rtl">
            {/* Header Skeleton */}
            <div className="bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                    <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                </div>
            </div>

            {/* Banner Skeleton */}
            <div className="mx-4 mt-4 h-40 bg-slate-200 rounded-2xl" />

            {/* Sections Row Skeleton */}
            <div className="flex gap-3 px-4 mt-6 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-16 bg-slate-200 rounded-full" />
                        <div className="w-14 h-3 bg-slate-200 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3 px-4 mt-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="w-full h-32 bg-slate-200" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                            <div className="h-3 bg-slate-200 rounded-full w-1/2" />
                            <div className="h-5 bg-slate-200 rounded-full w-1/3 mt-2" />
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                .animate-pulse {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
