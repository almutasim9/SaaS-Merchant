'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { addSection, updateSection } from '../sections/actions';

interface Section {
    id: string;
    name: string;
    image_url?: string;
}

interface SectionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    storeId: string;
    initialData?: Section | null;
}

export default function SectionsModal({ isOpen, onClose, onSuccess, storeId, initialData }: SectionsModalProps) {
    const [newName, setNewName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Sync state if initialData changes
    useEffect(() => {
        if (initialData && isOpen) {
            setNewName(initialData.name);
            setImageUrl(initialData.image_url || '');
        } else if (!initialData && isOpen) {
            setNewName('');
            setImageUrl('');
        }
    }, [initialData, isOpen]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `sections/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !newName.trim()) return;

        setActionLoading(true);
        try {
            if (initialData) {
                await updateSection(initialData.id, newName.trim(), imageUrl);
            } else {
                await addSection(storeId, newName.trim(), imageUrl);
            }
            setNewName('');
            setImageUrl('');
            onSuccess?.();
            onClose();
        } catch (err: any) {
            alert('حدث خطأ: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-10" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 font-sans">
                {/* Header */}
                <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-indigo-600">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {initialData ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                )}
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-none">
                                {initialData ? 'تعديل القسم' : 'إضافة قسم جديد'}
                            </h2>
                            <p className="text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 lg:mt-2">
                                {initialData ? 'قم بتعديل بيانات القسم المحدد أدناه.' : 'أدخل بيانات القسم الجديد أدناه ليتم عرضه في متجرك.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-white transition-all active:scale-95 shadow-sm">
                        <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 lg:p-10 space-y-8 bg-[#FAFBFF]">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم القسم</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="مثال: إلكترونيات، أزياء..."
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-black shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">صورة القسم (اختياري)</label>
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 shadow-sm">
                                        {imageUrl ? (
                                            <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 24M12 12h.01M4 24h16a2 2 0 002-2V8a2 2 0 00-2-2H4a2 2 0 00-2-2v14a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 opacity-0_cursor-pointer" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-700">{initialData ? 'تغيير صورة القسم' : 'رفع صورة القسم'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">JPG, PNG بنسبة 1:1</p>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={actionLoading || !newName.trim()}
                            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-600/30 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 text-sm tracking-tight"
                        >
                            {actionLoading ? 'جاري الحفظ...' : initialData ? 'حفظ التغييرات' : 'إضافة القسم الآن'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
