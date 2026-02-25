'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSections, deleteSection } from './actions';
import SectionsModal from '../products/SectionsModal';

interface Section {
    id: string;
    name: string;
    image_url?: string;
    store_id: string;
}

export default function MerchantSectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: storeData } = await supabase
                .from('stores')
                .select('id')
                .eq('merchant_id', user.id)
                .single();

            if (storeData) {
                setStoreId(storeData.id);
                const sectionsData = await getSections(storeData.id);
                setSections(sectionsData as Section[]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف القسم "${name}"؟`)) return;

        try {
            await deleteSection(id);
            setSections(sections.filter(s => s.id !== id));
        } catch (err: any) {
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const openAddModal = () => {
        setSelectedSection(null);
        setIsModalOpen(true);
    };

    const openEditModal = (section: Section) => {
        setSelectedSection(section);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-10 pb-10 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tighter">إدارة الأقسام</h1>
                    <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest">تحكم في أقسام متجرك، قم بتعديلها أو حذفها بسهولة من خلال هذا المعرض.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-8 py-3 lg:py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة قسم جديد
                </button>
            </div>

            {/* Sections Full-Width List */}
            <div className="space-y-4">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">الأقسام الحالية ({sections.length})</h3>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {sections.length > 0 ? (
                            sections.map((section) => (
                                <div key={section.id} className="p-6 lg:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-100 shadow-sm shrink-0 transition-transform group-hover:scale-105">
                                            {section.image_url ? (
                                                <img src={section.image_url} className="w-full h-full object-cover" alt={section.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 font-black text-xl">✨</div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg lg:text-xl leading-none">{section.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2.5 tracking-widest">معرف القسم المميز: {section.id.slice(0, 12)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => openEditModal(section)}
                                            className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                        >
                                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(section.id, section.name)}
                                            className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                        >
                                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 lg:p-32 text-center space-y-6">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-slate-500 font-black text-lg lg:text-xl">لا توجد أقسام حالياً هُنا.</p>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">ابدأ بإضافة أول قسم لمتجرك لترتيب منتجاتك بشكل احترافي.</p>
                                </div>
                                <button
                                    onClick={openAddModal}
                                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                                >
                                    إضافة أول قسم الآن
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {storeId && (
                <SectionsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    storeId={storeId}
                    initialData={selectedSection}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
