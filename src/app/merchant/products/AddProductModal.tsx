'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// --- Types & Interfaces ---
interface WeightOption {
    value: string;
    unit: string;
}

interface ProductOptions {
    sizes: string[];
    colors: string[];
    weights: WeightOption[];
}

interface ProductAttributes {
    hasVariants: boolean;
    options: ProductOptions;
    weightPrices: Record<string, string>;
    isAvailable: boolean;
    outOfStockBehavior: 'hide' | 'show_badge';
    isHidden?: boolean;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    image_url?: string;
    attributes?: ProductAttributes;
    stock_quantity: number;
}

interface Section {
    id: string;
    name: string;
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    sections: Section[];
    initialData?: Product | null;
}

interface FormDataState {
    name: string;
    description: string;
    price: string;
    category: string;
    isAvailable: boolean;
    outOfStockBehavior: 'hide' | 'show_badge';
    image_url: string;
    hasVariants: boolean;
    options: ProductOptions;
    weightPrices: Record<string, string>;
}

export default function AddProductModal({ isOpen, onClose, onSuccess, storeId, sections, initialData }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [tempColor, setTempColor] = useState('#4F46E5');

    const [formData, setFormData] = useState<FormDataState>({
        name: '',
        description: '',
        price: '',
        category: '',
        isAvailable: true,
        outOfStockBehavior: 'hide',
        image_url: '',
        hasVariants: false,
        options: {
            sizes: [],
            colors: [],
            weights: []
        },
        weightPrices: {}
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    price: initialData.price?.toString() || '',
                    category: initialData.category || (sections.length > 0 ? sections[0].name : ''),
                    isAvailable: initialData.attributes?.isAvailable ?? true,
                    outOfStockBehavior: initialData.attributes?.outOfStockBehavior || 'hide',
                    image_url: initialData.image_url || '',
                    hasVariants: initialData.attributes?.hasVariants || false,
                    options: initialData.attributes?.options || { sizes: [], colors: [], weights: [] },
                    weightPrices: initialData.attributes?.weightPrices || {}
                });
                setIsAdvancedOpen(initialData.attributes?.hasVariants || false);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: sections.length > 0 ? sections[0].name : '',
                    isAvailable: true,
                    outOfStockBehavior: 'hide',
                    image_url: '',
                    hasVariants: false,
                    options: { sizes: [], colors: [], weights: [] },
                    weightPrices: {}
                });
                setIsAdvancedOpen(false);
            }
            setSuccess(false);
            setError(null);
        }
    }, [isOpen, initialData, sections]);

    if (!isOpen) return null;

    // --- Variant Helper Functions ---
    const addOptionValue = (type: 'sizes' | 'colors', value: string) => {
        if (!value.trim()) return;
        if (formData.options[type].includes(value)) return;
        setFormData(prev => ({
            ...prev,
            options: { ...prev.options, [type]: [...prev.options[type], value] }
        }));
    };

    const addWeightVariant = (value: string, unit: string) => {
        if (!value.trim()) return;
        const weightStr = `${value}${unit}`;
        if (formData.options.weights.some(w => `${w.value}${w.unit}` === weightStr)) return;
        setFormData(prev => ({
            ...prev,
            options: { ...prev.options, weights: [...prev.options.weights, { value, unit }] }
        }));
    };

    const removeOptionValue = (type: 'sizes' | 'colors' | 'weights', index: number) => {
        setFormData(prev => {
            let weightKey = '';
            if (type === 'weights') {
                const w = prev.options.weights[index];
                weightKey = `${w.value}${w.unit}`;
                const newWeights = prev.options.weights.filter((_, i) => i !== index);
                const newWeightPrices = { ...prev.weightPrices };
                delete newWeightPrices[weightKey];
                return {
                    ...prev,
                    options: { ...prev.options, weights: newWeights },
                    weightPrices: newWeightPrices
                };
            } else {
                // Handle sizes and colors
                const list = prev.options[type];
                const newList = list.filter((_, i) => i !== index);
                return {
                    ...prev,
                    options: { ...prev.options, [type]: newList }
                };
            }
        });
    };

    const setWeightPrice = (weight: string, price: string) => {
        setFormData(prev => ({
            ...prev,
            weightPrices: { ...prev.weightPrices, [weight]: price }
        }));
    };
    // ----------------------------

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('store-assets').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'فشل رفع الصورة.';
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: sections.length > 0 ? sections[0].name : '',
            isAvailable: true,
            outOfStockBehavior: 'hide',
            image_url: '',
            hasVariants: false,
            options: { sizes: [], colors: [], weights: [] },
            weightPrices: {}
        });
        setSuccess(false);
        setError(null);
        setIsAdvancedOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!formData.name.trim()) throw new Error('يرجى إدخال اسم المنتج.');
            if (!formData.price || parseFloat(formData.price) <= 0) throw new Error('يرجى إدخال سعر صحيح للمنتج.');
            if (!formData.category) throw new Error('يرجى اختيار قسم للمنتج.');

            const attributes: ProductAttributes = {
                hasVariants: formData.hasVariants,
                options: formData.options,
                weightPrices: formData.weightPrices,
                isAvailable: formData.isAvailable,
                outOfStockBehavior: formData.outOfStockBehavior
            };

            const productData = {
                store_id: storeId,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price || '0'),
                category: formData.category,
                stock_quantity: formData.isAvailable ? 999 : 0,
                image_url: formData.image_url,
                attributes: attributes, // Now strictly typed
            };

            const { error: dbError } = initialData
                ? await supabase.from('products').update(productData).eq('id', initialData.id)
                : await supabase.from('products').insert(productData);

            if (dbError) throw dbError;
            setSuccess(true);
            onSuccess();
            if (!initialData) setTimeout(() => resetForm(), 1500);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => !loading && onClose()} />

            <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 italic tracking-tight leading-none">
                                {initialData ? 'تعديل المنتج' : 'إضافة منتج سريع'}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">
                                {initialData ? 'تحديث بيانات المنتج وتعديله.' : 'أدخل بيانات المنتج الأساسية والمتقدمة هنا.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#FAFBFF]">
                    {success ? (
                        <div className="py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-4xl font-black text-slate-800 italic">تم الحفظ بنجاح!</h3>
                            <div className="flex gap-4 justify-center">
                                <button onClick={resetForm} className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black italic shadow-xl shadow-indigo-600/20 hover:bg-slate-950 transition-all">إضافة منتج آخر</button>
                                <button onClick={onClose} className="px-10 py-5 bg-white text-slate-500 border border-slate-200 rounded-3xl font-black italic">إغلاق</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left Section - Main Inputs */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المنتج <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="مثال: فستان صيفي قطني"
                                            className="w-full bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4.5 text-sm font-bold italic shadow-sm focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القسم <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4.5 text-sm font-bold italic shadow-sm focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none appearance-none"
                                            >
                                                <option value="">اختر القسم المناسب</option>
                                                {sections.map(section => (
                                                    <option key={section.id} value={section.name}>{section.name}</option>
                                                ))}
                                            </select>
                                            <svg className="w-5 h-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">السعر <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-14 pr-6 py-4.5 text-lg font-black italic shadow-sm focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none"
                                                />
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">ر.س</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end pb-3">
                                            <label className="flex items-center gap-3 cursor-pointer group bg-white border border-slate-100 px-6 py-4.5 rounded-[1.5rem] shadow-sm hover:border-emerald-500 transition-all w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isAvailable}
                                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-xs font-black text-slate-700 italic">متوفر للطلب</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section - Image & Desc */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">صورة المنتج</label>
                                        <div className="relative group aspect-video w-full rounded-[2rem] border-4 border-dashed border-white bg-slate-100/50 flex flex-col items-center justify-center transition-all overflow-hidden hover:bg-white hover:border-indigo-100 hover:shadow-2xl">
                                            {formData.image_url ? (
                                                <>
                                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="px-4 py-2 bg-white text-slate-950 text-[10px] font-black rounded-xl">تغيير الصورة</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-center">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-all">
                                                        {uploading ? (
                                                            <div className="w-6 h-6 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-800 italic">اسحب الصورة أو اضغط هنا</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">وصف المنتج</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="اكتب وصفاً جذاباً يشرح مميزات منتجك..."
                                            className="w-full bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4.5 text-sm font-bold italic shadow-sm focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Section Toggle */}
                            <div className="pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                    className="flex items-center gap-3 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] italic hover:text-slate-950 transition-all group"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isAdvancedOpen ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                        <svg className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {isAdvancedOpen ? 'إخفاء الإعدادات المتقدمة' : 'الإعدادات المتقدمة والمتغيرات'}
                                </button>
                            </div>

                            {isAdvancedOpen && (
                                <div className="space-y-12 pt-10 animate-in fade-in slide-in-from-top-6 duration-500">
                                    {/* Variant Management */}
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 italic">المتغيرات (Variants)</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, hasVariants: !prev.hasVariants }))}
                                                className={`w-14 h-7 rounded-full transition-all relative ${formData.hasVariants ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.hasVariants ? 'right-8' : 'right-1'}`} />
                                            </button>
                                        </div>

                                        {formData.hasVariants && (
                                            <div className="p-10 space-y-10">
                                                {/* Global Sizes */}
                                                <div className="space-y-5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">المقاسات المتاحة (Sizes)</label>
                                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => {
                                                            const isActive = formData.options.sizes.includes(size);
                                                            return (
                                                                <button
                                                                    key={size}
                                                                    type="button"
                                                                    onClick={() => isActive ? removeOptionValue('sizes', formData.options.sizes.indexOf(size)) : addOptionValue('sizes', size)}
                                                                    className={`h-11 flex items-center justify-center rounded-xl font-black italic text-xs border transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}
                                                                >
                                                                    {size}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="+ أضف مقاس مخصص واضغط Enter..."
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOptionValue('sizes', e.currentTarget.value); e.currentTarget.value = ''; } }}
                                                        className="h-11 w-full border border-slate-100 border-dashed rounded-xl px-5 text-slate-400 font-black italic text-[10px] focus:outline-none focus:border-indigo-600 transition-all bg-slate-50/30"
                                                    />
                                                </div>

                                                {/* Colors */}
                                                <div className="space-y-5 pt-8 border-t border-slate-50">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">الألوان المتوفرة (Colors)</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowColorPicker(!showColorPicker);
                                                                if (!showColorPicker) setTempColor('#4F46E5');
                                                            }}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showColorPicker ? 'bg-rose-500 text-white rotate-45' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 active:scale-90 hover:bg-slate-900'}`}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                        </button>
                                                    </div>

                                                    {showColorPicker && (
                                                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-300">
                                                            <div className="relative group">
                                                                <div
                                                                    className="w-16 h-16 rounded-3xl border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105"
                                                                    style={{ backgroundColor: tempColor }}
                                                                />
                                                                <input
                                                                    type="color"
                                                                    value={tempColor}
                                                                    onChange={(e) => setTempColor(e.target.value)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                />
                                                            </div>
                                                            <div className="flex-1 space-y-3 w-full text-center sm:text-right">
                                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                                    {['#FFFFFF', '#000000', '#FF0000', '#0000FF', '#008000', '#FFFF00'].map(p => (
                                                                        <button
                                                                            key={p}
                                                                            type="button"
                                                                            onClick={() => setTempColor(p)}
                                                                            className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 hover:scale-110 transition-all"
                                                                            style={{ backgroundColor: p }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] font-black text-slate-400 italic">اضغط على المربع لاختيار لون مخصص</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    addOptionValue('colors', tempColor);
                                                                    setShowColorPicker(false);
                                                                }}
                                                                className="px-8 py-3.5 bg-slate-950 text-white rounded-2xl font-black italic text-xs shadow-xl active:scale-95 transition-all hover:bg-emerald-600"
                                                            >
                                                                حفظ اللون
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-4 min-h-[40px]">
                                                        {formData.options.colors.length === 0 && !showColorPicker && (
                                                            <span className="text-[10px] font-bold text-slate-300 italic">لم يتم إضافة ألوان بعد...</span>
                                                        )}
                                                        {formData.options.colors.map((color, idx) => (
                                                            <div key={idx} className="group relative">
                                                                <div className="w-11 h-11 rounded-full border-4 border-white shadow-lg ring-1 ring-slate-100 transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
                                                                <button onClick={() => removeOptionValue('colors', idx)} className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90 border-2 border-white">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Weights */}
                                                <div className="space-y-5 pt-8 border-t border-slate-50">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">الأوزان والأحجام (Weights/Volumes)</label>
                                                    <div className="flex flex-wrap gap-4">
                                                        {formData.options.weights.map((w, idx) => (
                                                            <div key={idx} className="group relative px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black italic text-xs border border-indigo-100 shadow-sm flex items-center gap-3">
                                                                {w.value} {w.unit}
                                                                <button onClick={() => removeOptionValue('weights', idx)} className="w-5 h-5 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-sm">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-4 pt-2">
                                                        <input id="w-val" type="text" placeholder="الكمية (مثال: 500)" className="h-12 flex-1 border border-slate-100 rounded-xl px-4 text-xs font-bold italic outline-none focus:border-indigo-600" />
                                                        <select id="w-unit" className="h-12 w-28 border border-slate-100 rounded-xl px-3 text-xs font-bold italic outline-none focus:border-indigo-600 appearance-none bg-white">
                                                            <option value="g">جم (g)</option>
                                                            <option value="kg">كجم (kg)</option>
                                                            <option value="ml">مل (ml)</option>
                                                            <option value="L">لتر (L)</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const v = (document.getElementById('w-val') as HTMLInputElement).value;
                                                                const u = (document.getElementById('w-unit') as HTMLSelectElement).value;
                                                                if (v) { addWeightVariant(v, u); (document.getElementById('w-val') as HTMLInputElement).value = ''; }
                                                            }}
                                                            className="h-12 px-8 bg-slate-900 text-white rounded-xl font-black italic text-xs hover:bg-indigo-600 transition-all shadow-lg"
                                                        >
                                                            إضافة
                                                        </button>
                                                    </div>

                                                    {/* Price Overrides */}
                                                    {formData.options.weights.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                            {formData.options.weights.map((w, idx) => {
                                                                const key = `${w.value}${w.unit}`;
                                                                return (
                                                                    <div key={idx} className="space-y-2">
                                                                        <label className="text-[9px] font-black text-slate-400 italic">سعر {w.value}{w.unit} (اختياري)</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                value={formData.weightPrices[key] || ''}
                                                                                onChange={(e) => setWeightPrice(key, e.target.value)}
                                                                                placeholder="سعر مخصص"
                                                                                className="w-full h-11 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold italic outline-none"
                                                                            />
                                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-black">ر.س</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Out of Stock Logic */}
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="space-y-2 text-right">
                                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">إدارة المخزون</h4>
                                            <p className="text-xl font-black text-slate-800 italic">سلوك المسوق عند نفاذ الكمية</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, outOfStockBehavior: 'hide' })}
                                                className={`px-8 py-4 rounded-2xl border-2 transition-all font-black italic text-xs ${formData.outOfStockBehavior === 'hide' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                إخفاء المنتج تماماً
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, outOfStockBehavior: 'show_badge' })}
                                                className={`px-8 py-4 rounded-2xl border-2 transition-all font-black italic text-xs ${formData.outOfStockBehavior === 'show_badge' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                إظهار "نفذ من المخزون"
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl text-sm font-black italic animate-shake">
                                    ⚠️ {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                {!success && (
                    <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between sticky bottom-0 z-20">
                        <button onClick={onClose} className="px-10 py-4 text-slate-400 font-black italic hover:text-slate-900 transition-all">إلغاء العملية</button>
                        <div className="flex gap-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || uploading}
                                className="px-14 py-4.5 bg-indigo-600 text-white rounded-3xl font-black italic shadow-2xl shadow-indigo-600/30 hover:bg-slate-950 transition-all active:scale-95 disabled:opacity-50 min-w-[200px] flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{initialData ? 'تحديث البيانات' : 'إضافة هذا المنتج'}</span>
                                        {!initialData && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
}
