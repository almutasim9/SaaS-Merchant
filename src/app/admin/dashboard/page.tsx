import { supabaseAdmin } from '@/lib/supabase-server';

export const metadata = {
    title: 'نظام الإدارة | MenuPlus',
};

// Types for Admin Dashboard
interface PlatformStats {
    totalMerchants: number;
    activeStores: number;
    totalOrders: number;
}

export default async function AdminDashboardPage() {

    // 1. Fetch Global Stats using Admin Client (Bypasses RLS)
    const [{ count: totalMerchants }, { count: activeStores }, { count: totalOrders }] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'merchant'),
        supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    const stats: PlatformStats = {
        totalMerchants: totalMerchants || 0,
        activeStores: activeStores || 0,
        totalOrders: totalOrders || 0,
    };

    // 2. Fetch Recent Stores using Admin Client
    const { data: recentStores } = await supabaseAdmin
        .from('stores')
        .select(`
            id,
            name,
            created_at,
            merchant_id,
            profiles (full_name, phone_number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="p-8 pb-32 lg:pb-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">ملخص المنصة</h1>
                <p className="text-slate-500 mt-2 font-medium">نظرة عامة على نشاط المنصة وأدائها العام.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="إجمالي التجار"
                    value={stats.totalMerchants.toLocaleString()}
                    icon={
                        <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    trend="+12% هذا الشهر"
                />
                <StatCard
                    title="المتاجر المفعلة"
                    value={stats.activeStores.toLocaleString()}
                    icon={
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    }
                    trend="نشاط ممتاز"
                />
                <StatCard
                    title="إجمالي الطلبات"
                    value={stats.totalOrders.toLocaleString()}
                    icon={
                        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    }
                    trend="تم تنفيذها بالمنصة"
                />
            </div>

            {/* Recent Stores Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">أحدث المتاجر المنضمة</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right bg-white">
                        <thead className="bg-[#FBFBFF] text-slate-500 text-sm font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-2xl">اسم المتجر</th>
                                <th className="px-6 py-4">التاجر (المالك)</th>
                                <th className="px-6 py-4">رقم الهاتف</th>
                                <th className="px-6 py-4 rounded-tl-2xl">تاريخ الانضمام</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentStores?.map((store: any) => (
                                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{store.name}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5 font-mono">ID: {store.id.slice(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {store.profiles?.full_name || 'غير محدد'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-600" dir="ltr">
                                        {store.profiles?.phone_number || store.phone || 'لا يوجد'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                        {new Date(store.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                            {(!recentStores || recentStores.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">لا يوجد متاجر مسجلة حالياً</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Subcomponent for Stats
function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-400 mb-1">{title}</h3>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                    {trend}
                </div>
            </div>
        </div>
    );
}
