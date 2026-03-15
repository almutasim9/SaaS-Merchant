'use client';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8" dir="rtl">
            <div className="text-center max-w-md space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-black mb-2">خطأ في لوحة الإدارة</h2>
                    <p className="text-sm text-black font-medium">حدث خطأ أثناء تحميل هذه الصفحة. يرجى إعادة المحاولة.</p>
                </div>
                <button
                    onClick={reset}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    إعادة المحاولة
                </button>
            </div>
        </div>
    );
}
