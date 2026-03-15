export default function POSSkeleton() {
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6 sticky top-0 z-20">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="flex-1 max-w-2xl h-12 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="hidden lg:flex items-center gap-6">
                    <div className="w-24 h-8 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="w-32 h-12 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
            </div>

            {/* Sections Skeleton */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto bg-white/50 border-b border-slate-100">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="px-6 py-4 w-24 h-8 bg-white border border-slate-200 rounded-xl animate-pulse" />
                ))}
            </div>

            {/* Grid Skeleton */}
            <div className="flex-1 p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                            <div className="aspect-square bg-slate-100 animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                                <div className="flex justify-between items-center">
                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                                    <div className="w-8 h-8 bg-slate-100 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
