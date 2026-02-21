import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebarLinks from './AdminSidebarLinks';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Double verify on layout mount
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') {
        redirect('/merchant/dashboard'); // Kick back
    }

    return (
        <div className="flex h-screen bg-[#F8F9FB] font-sans text-right" dir="rtl">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
                <div className="p-8 border-b border-slate-800">
                    <h1 className="text-2xl font-black bg-gradient-to-l from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        SaaS Admin
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">لوحة تحكم مدير المنصة</p>
                </div>

                <AdminSidebarLinks />

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                            <span className="text-sm font-bold text-white">SA</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white block truncate">{user.email}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8F9FB]">
                {/* Global Top Navbar for Admin */}
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm z-10">
                    <h2 className="text-lg font-bold text-slate-800">ملخص النظام</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">نظام محمي</span>
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
