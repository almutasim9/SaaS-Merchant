'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Store {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    is_active: boolean;
}

export default function SuperAdminDashboard() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [userRole, setUserRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkUser();
        fetchData();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            router.push('/login');
        } else {
            setUserRole(profile.role);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch stats
            const { count: totalCount } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true });

            const { count: activeCount } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            setStats({
                total: totalCount || 0,
                active: activeCount || 0,
            });

            // Fetch stores
            const { data: storesData } = await supabase
                .from('stores')
                .select('*')
                .order('created_at', { ascending: false });

            setStores(storesData || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const toggleStoreStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('stores')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (!error) {
            fetchData(); // Refresh data
        }
    };

    if (!userRole && !loading) return null;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tighter italic">SAAS<span className="text-indigo-400">M</span></h1>
                    <p className="text-indigo-300 text-xs mt-1">Super Admin Panel</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-800 rounded-xl font-medium transition-all group">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-800 rounded-xl font-medium transition-all text-indigo-100/70 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Stores</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-800 rounded-xl font-medium transition-all text-indigo-100/70 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Users</span>
                    </a>
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-indigo-800/50 rounded-2xl p-4 border border-indigo-700/50">
                        <p className="text-xs text-indigo-300">Logged in as</p>
                        <p className="font-semibold text-sm truncate">Super Admin</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Overview</h2>
                        <p className="text-slate-500 text-sm">Welcome back to the command center.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/add-merchant')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Merchant
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dashboard Area */}
                <div className="p-8 space-y-8 overflow-y-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Total Stores</p>
                                    <p className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Active Stores</p>
                                    <p className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.active}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Platform Revenue</p>
                                    <p className="text-2xl font-bold text-slate-800">$0.00</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-amber-600 mt-2 font-semibold uppercase tracking-wider">Placeholder</p>
                        </div>
                    </div>

                    {/* Stores Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">Manage Stores</h3>
                            <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors">Export CSV</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Store Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subdomain</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Creation Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading stores...</td>
                                        </tr>
                                    ) : stores.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No stores found in the database.</td>
                                        </tr>
                                    ) : stores.map((store) => (
                                        <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-800">{store.name}</td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`https://${store.slug}.platform.com`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:underline flex items-center gap-1"
                                                >
                                                    {store.slug}.platform.com
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(store.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${store.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                    {store.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleStoreStatus(store.id, store.is_active)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${store.is_active
                                                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                                            }`}
                                                    >
                                                        {store.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
