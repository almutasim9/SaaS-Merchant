'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// --- Types & Interfaces ---
interface VariantOption {
    id: string;
    name: string; // e.g., "Color", "Size"
    values: string[]; // e.g., ["Red", "Blue"]
}

interface VariantCombination {
    id: string; // Derived from option values e.g., "Red-S"
    options: Record<string, string>; // e.g., { "Color": "Red", "Size": "S" }
    price: string; // Specific price override
}

interface ProductAttributes {
    hasVariants: boolean;
    variantOptions: VariantOption[];
    variantCombinations: VariantCombination[];
    isAvailable: boolean; // Global visibility
}

interface Section {
    id: string;
    name: string;
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

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    sections: Section[];
    initialData?: Product | null;
}

export default function AddProductModal({ isOpen, onClose, onSuccess, storeId, sections, initialData }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Basic Info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [isAvailable, setIsAvailable] = useState(true);

    // Variants
    const [hasVariants, setHasVariants] = useState(false);
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                setDescription(initialData.description || '');
                setPrice(initialData.price?.toString() || '');
                setCategory(initialData.category || (sections.length > 0 ? sections[0].name : ''));
                setImageUrl(initialData.image_url || '');
                setAdditionalImages((initialData.attributes as any)?.images || []);

                const attrs = initialData.attributes;
                setIsAvailable(attrs?.isAvailable ?? true);
                setHasVariants(attrs?.hasVariants || false);
                setVariantOptions(attrs?.variantOptions || []);
                setVariantCombinations(attrs?.variantCombinations || []);
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData, sections]);

    // --- Variant Logic ---

    // Generate combinations whenever options change
    useEffect(() => {
        if (!hasVariants || variantOptions.length === 0) {
            if (variantCombinations.length > 0) setVariantCombinations([]);
            return;
        }

        // Only generate options that have at least one value
        const validOptions = variantOptions.filter(o => o.values.length > 0 && o.name.trim() !== '');

        if (validOptions.length === 0) {
            setVariantCombinations([]);
            return;
        }

        // Cartesian Product
        const generateCombinations = (opts: VariantOption[], currentIdx: number, currentCombo: Record<string, string>): Record<string, string>[] => {
            if (currentIdx === opts.length) return [currentCombo];

            const option = opts[currentIdx];
            let results: Record<string, string>[] = [];

            for (const value of option.values) {
                results = results.concat(
                    generateCombinations(opts, currentIdx + 1, { ...currentCombo, [option.id]: value })
                );
            }
            return results;
        };

        const newCombosRaw = generateCombinations(validOptions, 0, {});

        // Map to VariantCombination objects, preserving existing prices if possible
        const newCombos: VariantCombination[] = newCombosRaw.map(comboMap => {
            // Create a unique ID for this exact combination to match against old state
            // Sort keys so order doesn't matter
            const sortedKeys = Object.keys(comboMap).sort();
            const comboId = sortedKeys.map(k => `${k}:${comboMap[k]}`).join('|');

            const existing = variantCombinations.find(c => c.id === comboId);

            return {
                id: comboId,
                options: comboMap,
                price: existing ? existing.price : '' // preserve price if combo existed
            };
        });

        setVariantCombinations(newCombos);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantOptions, hasVariants]); // Intentionally omitting variantCombinations to avoid infinite loop

    const addOption = (presetName: string = '', presetValues: string[] = []) => {
        const newId = `opt-${Date.now()}`;
        setVariantOptions([...variantOptions, { id: newId, name: presetName, values: presetValues }]);
    };

    const updateOptionName = (id: string, name: string) => {
        setVariantOptions(prev => prev.map(o => o.id === id ? { ...o, name } : o));
    };

    const removeOption = (id: string) => {
        setVariantOptions(prev => prev.filter(o => o.id !== id));
    };

    const addOptionValue = (id: string, value: string) => {
        if (!value.trim()) return;
        setVariantOptions(prev => prev.map(o => {
            if (o.id === id && !o.values.includes(value.trim())) {
                return { ...o, values: [...o.values, value.trim()] };
            }
            return o;
        }));
    };

    const removeOptionValue = (id: string, valueToRemove: string) => {
        setVariantOptions(prev => prev.map(o => {
            if (o.id === id) {
                return { ...o, values: o.values.filter(v => v !== valueToRemove) };
            }
            return o;
        }));
    };

    const updateCombinationPrice = (comboId: string, price: string) => {
        setVariantCombinations(prev => prev.map(c => c.id === comboId ? { ...c, price } : c));
    };

    // --- Media Upload ---
    const MAX_IMAGES = 5; // 1 primary + 4 additional
    const allImages = [imageUrl, ...additionalImages].filter(Boolean);
    const canAddMore = allImages.length < MAX_IMAGES;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('حجم الصورة كبير جداً (الحد الأقصى 2MB).');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            let bucket = 'product_images';
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

            if (uploadError) {
                console.warn('Fallback to store-assets bucket');
                bucket = 'store-assets';
                const { error: fallbackError } = await supabase.storage.from(bucket).upload(filePath, file);
                if (fallbackError) throw fallbackError;
            }

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            // If no primary image yet, set as primary. Otherwise add to additional.
            if (!imageUrl) {
                setImageUrl(publicUrl);
            } else {
                setAdditionalImages(prev => [...prev, publicUrl]);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'فشل رفع الصورة.';
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (url: string) => {
        if (url === imageUrl) {
            // Remove primary → promote first additional to primary
            if (additionalImages.length > 0) {
                setImageUrl(additionalImages[0]);
                setAdditionalImages(prev => prev.slice(1));
            } else {
                setImageUrl('');
            }
        } else {
            setAdditionalImages(prev => prev.filter(img => img !== url));
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setCategory(sections.length > 0 ? sections[0].name : '');
        setImageUrl('');
        setAdditionalImages([]);
        setIsAvailable(true);
        setHasVariants(false);
        setVariantOptions([]);
        setVariantCombinations([]);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!name.trim()) throw new Error('يرجى إدخال اسم المنتج.');
            if (!price || parseFloat(price) <= 0) throw new Error('يرجى إدخال السعر الأساسي للمنتج.');
            if (!category) throw new Error('يرجى اختيار قسم للمنتج.');

            const attributes: any = {
                hasVariants,
                variantOptions: hasVariants ? variantOptions.filter(o => o.name && o.values.length > 0) : [],
                variantCombinations: hasVariants ? variantCombinations : [],
                isAvailable,
                images: additionalImages
            };

            const productData = {
                store_id: storeId,
                name,
                description,
                price: parseFloat(price || '0'),
                category,
                stock_quantity: isAvailable ? 999 : 0, // Mock stock as requested
                image_url: imageUrl,
                attributes
            };

            const { error: dbError } = initialData
                ? await supabase.from('products').update(productData).eq('id', initialData.id)
                : await supabase.from('products').insert(productData);

            if (dbError) throw dbError;
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-all" dir="rtl">
            <div className="w-full lg:w-[800px] bg-[#F8FAFC] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-l border-slate-200/60 object-contain">

                {/* Header */}
                <div className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            {initialData ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                        </h2>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            {initialData ? 'قم بتحديث تفاصيل واسعار هذا المنتج.' : 'أضف منتجك لتوسيع كتالوج متجرك.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Right Column: Main Info (RTL) */}
                        <div className="flex-1 space-y-6">

                            {/* Basic Details Card */}
                            <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200/60 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-700">صور المنتج</label>
                                        <span className="text-[10px] font-bold text-slate-400">{allImages.length}/{MAX_IMAGES}</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-3">
                                        {allImages.map((url, idx) => (
                                            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border-2 border-slate-200 group">
                                                <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                                                {idx === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[7px] font-black rounded-md uppercase">رئيسية</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(url)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-white/90 backdrop-blur-md text-rose-500 rounded-md flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {canAddMore && (
                                            <div className="relative aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                                {uploading ? (
                                                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" title="أضف صورة" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">الصورة الأولى هي الرئيسية. أضف حتى {MAX_IMAGES} صور (PNG, JPG — حتى 2MB).</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المنتج</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قميص قطني فاخر" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الوصف (اختياري)</label>
                                    <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب وصفاً جذاباً..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none" />
                                </div>
                            </div>

                            {/* Pricing Card */}
                            <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200/60 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800">السعر والتسعير</h3>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">السعر الأساسي</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">د.ع</span>
                                        <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" dir="ltr" />
                                    </div>
                                </div>
                            </div>

                            {/* Variants Matrix Card */}
                            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="p-6 lg:p-8 border-b border-slate-100 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800">المتغيرات (Variants)</h3>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 font-medium">أضف خيارات مثل المقاس أو اللون. هذه الحقول لن تؤثر على المخزون (كتالوج فقط).</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHasVariants(!hasVariants)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${hasVariants ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${hasVariants ? 'right-7' : 'right-1'}`} />
                                    </button>
                                </div>

                                {hasVariants && (
                                    <div className="p-6 lg:p-8 space-y-8 bg-slate-50/50">

                                        {/* Options Builder */}
                                        <div className="space-y-6">
                                            {variantOptions.map((option, idx) => (
                                                <div key={option.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 relative group">
                                                    <button onClick={() => removeOption(option.id)} className="absolute top-4 left-4 w-6 h-6 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الخيار {idx + 1}</label>
                                                        <input type="text" value={option.name} onChange={(e) => updateOptionName(option.id, e.target.value)} placeholder="مثال: الحجم، اللون، المقاس" className="w-full lg:w-1/2 h-10 border-b-2 border-slate-100 bg-transparent px-2 text-sm font-bold text-slate-800 focus:border-indigo-500 transition-colors outline-none" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القيم المتاحة</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {option.values.map(val => {
                                                                const isColorOption = option.name === 'اللون';
                                                                const isHex = isColorOption && val.startsWith('#');
                                                                return (
                                                                    <div key={val} className={`px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-2 ${isHex ? 'pl-2' : ''}`}>
                                                                        {isHex ? (
                                                                            <div className="w-5 h-5 rounded-full border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" style={{ backgroundColor: val }} title="لون" />
                                                                        ) : (
                                                                            <span>{val}</span>
                                                                        )}
                                                                        <button onClick={() => removeOptionValue(option.id, val)} className={`text-slate-400 hover:text-rose-500 ${isHex ? 'mr-1' : ''}`}>×</button>
                                                                    </div>
                                                                );
                                                            })}
                                                            {option.name === 'اللون' ? (
                                                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] cursor-pointer hover:scale-105 transition-transform">
                                                                        <input type="color" id={`color-picker-${option.id}`} className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer" defaultValue="#3b82f6" />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const colorInput = document.getElementById(`color-picker-${option.id}`) as HTMLInputElement;
                                                                            if (colorInput) {
                                                                                addOptionValue(option.id, colorInput.value.toUpperCase());
                                                                            }
                                                                        }}
                                                                        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-[11px] font-black text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                        تأكيد الإضافة
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <input type="text" placeholder="أضف قيمة ثم اضغط Enter للحفظ..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOptionValue(option.id, e.currentTarget.value); e.currentTarget.value = ''; } }} className="min-w-[200px] flex-1 h-9 bg-slate-50 border border-slate-200 border-dashed rounded-lg px-3 text-xs font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none transition-all" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption()} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                إضافة خيار مخصص
                                            </button>

                                            {/* Quick Templates */}
                                            <div className="flex items-center gap-2 flex-wrap pt-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">قوالب جاهزة:</span>
                                                <button onClick={() => addOption('المقاس', ['S', 'M', 'L', 'XL'])} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors">المقاسات</button>
                                                <button onClick={() => addOption('اللون', ['#000000', '#FFFFFF'])} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors">الألوان</button>
                                                <button onClick={() => addOption('الوزن', ['500g', '1kg'])} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors">الأوزان</button>
                                            </div>
                                        </div>

                                        {/* Combinations Matrix */}
                                        {variantCombinations.length > 0 && (
                                            <div className="space-y-4 pt-6 border-t border-slate-200">
                                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">تخصيص الأسعار (اختياري)</h4>
                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                                    <table className="w-full text-right text-xs font-bold">
                                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400">
                                                            <tr>
                                                                <th className="px-4 py-3 w-4/6 font-black uppercase tracking-widest">المتغير</th>
                                                                <th className="px-4 py-3 font-black uppercase tracking-widest">السعر المخصص</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {variantCombinations.map((combo) => (
                                                                <tr key={combo.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-3 py-2 text-slate-700">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {Object.entries(combo.options).map(([optId, val]) => {
                                                                                const isHex = val.startsWith('#');
                                                                                return (
                                                                                    <span key={optId} className={`px-1.5 py-0.5 bg-slate-100/80 border border-slate-200/60 rounded-md text-[10px] font-bold text-slate-700 flex items-center justify-center ${isHex ? 'min-w-[20px]' : ''}`}>
                                                                                        {isHex ? (
                                                                                            <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: val }} title="لون" />
                                                                                        ) : (
                                                                                            val
                                                                                        )}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-1.5 w-1/3">
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">د.ع</span>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="الافتراضي"
                                                                                value={combo.price}
                                                                                onChange={(e) => updateCombinationPrice(combo.id, e.target.value)}
                                                                                className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                                                                                dir="ltr"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Left Column: Organization (RTL) */}
                        <div className="w-full lg:w-72 space-y-6 flex-shrink-0">



                            {/* Organization Card */}
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm space-y-5">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">التنظيم</h3>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">القسم (Category)</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                                        <option value="" disabled>اختر القسم المناسب</option>
                                        {sections.map(sec => (
                                            <option key={sec.id} value={sec.name}>{sec.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white border-t border-slate-200 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-30">
                    <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 text-xs transition-colors">إلغاء</button>
                    <button onClick={handleSubmit} disabled={loading || uploading} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>{initialData ? 'حفظ التعديلات' : 'إضافة المنتج'}</span>}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
            `}</style>
        </div>
    );
}
