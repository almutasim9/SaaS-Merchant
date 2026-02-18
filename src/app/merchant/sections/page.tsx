'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSections, addSection, updateSection, deleteSection } from './actions';
import Link from 'next/link';

export default function SectionsManagementPage() {
    const [sections, setSections] = useState<any[]>([]);
    const [newName, setNewName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<any | null>(null);
    const router = useRouter();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', user.id)
            .single();

        if (storeData) {
            setStoreId(storeData.id);
            const data = await getSections(storeData.id);
            setSections(data);
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `sections/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products') // Reuse products bucket for now or use a new one
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setImageUrl(publicUrl);
        } catch (err: any) {
            alert('فشل رفع الصورة: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !newName.trim()) return;

        setAdding(true);
        try {
            if (editingSection) {
                const updated = await updateSection(editingSection.id, newName.trim(), imageUrl);
                setSections(sections.map(s => s.id === updated.id ? updated : s));
            } else {
                const added = await addSection(storeId, newName.trim(), imageUrl);
                setSections([...sections, added]);
            }
            setNewName('');
            setImageUrl('');
            setEditingSection(null);
        } catch (err: any) {
            alert('حدث خطأ: ' + err.message);
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (section: any) => {
        setEditingSection(section);
        setNewName(section.name);
        setImageUrl(section.image_url || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingSection(null);
        setNewName('');
        setImageUrl('');
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

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-10 pb-10 space-y-10" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tighter italic">إدارة الأقسام</h1>
                    <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest italic">إضافة وتعديل أقسام المنتجات في متجرك.</p>
                </div>
                <Link
                    href="/merchant/products"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-sm shadow-sm hover:shadow-md transition-all"
                >
                    العودة للمنتجات
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Add/Edit Section Form */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 italic">
                            {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
                        </h2>
                        {editingSection && (
                            <button
                                onClick={cancelEdit}
                                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                            >
                                إلغاء التعديل
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAdd} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم القسم</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="مثال: إلكترونيات، أزياء، مأكولات..."
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold italic"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">صورة القسم (اختياري)</label>
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                                        {imageUrl ? (
                                            <img src={imageUrl} className="w-full h-full object-cover" alt="Section preview" />
                                        ) : (
                                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 24M12 12h.01M4 24h16a2 2 0 002-2V8a2 2 0 00-2-2H4a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        disabled={uploading}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600">انقر لرفع صورة</p>
                                    <p className="text-[10px] text-slate-400 font-medium">JPG, PNG بنسبة 1:1</p>
                                </div>
                            </div>
                        </div>
                        <button
                            disabled={adding || !newName.trim()}
                            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black italic shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {adding ? 'جاري الحفظ...' : (editingSection ? 'حفظ التغييرات' : 'إضافة القسم')}
                        </button>
                    </form>
                </div>

                {/* Sections List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <h2 className="text-xl font-black text-slate-800 italic">الأقسام الحالية</h2>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {sections.length > 0 ? (
                            sections.map((section) => (
                                <div key={section.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shadow-sm">
                                            {section.image_url ? (
                                                <img src={section.image_url} className="w-full h-full object-cover" alt={section.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 text-lg">
                                                    ✨
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-slate-700 italic">{section.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEdit(section)}
                                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(section.id, section.name)}
                                            className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center opacity-30 italic font-black text-slate-400 text-xs">
                                لا توجد أقسام مضافة بعد.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
