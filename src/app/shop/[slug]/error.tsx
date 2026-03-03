'use client';

export default function ShopError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
            <div className="text-center max-w-sm space-y-6">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">عذراً، حدث خطأ</h2>
                    <p className="text-sm text-slate-400 font-medium">يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
                </div>
                <button
                    onClick={reset}
                    className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-900 transition-all active:scale-95"
                >
                    تحديث الصفحة
                </button>
            </div>
        </div>
    );
}
