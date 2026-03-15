'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toggle } from '@/components/ui/Toggle';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { useFeatureGate } from '@/hooks/useFeatureGate';

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
    stock_quantity: string; // New: stock per variant
    isUnavailable?: boolean; // New: toggle to disable specific combo
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
    name_en?: string;
    name_ku?: string;
}

interface Product {
    id: string;
    name: string;
    name_en?: string;
    name_ku?: string;
    description?: string;
    description_en?: string;
    description_ku?: string;
    price: number;
    section_id: string;
    image_url?: string;
    attributes?: ProductAttributes;
    stock_quantity: number;
    display_order?: number;
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    sections: Section[];
    initialData?: Product | null;
    storeSubscription?: any;
    storeCurrency?: 'IQD' | 'USD';
}

export default function AddProductModal({ isOpen, onClose, onSuccess, storeId, sections, initialData, storeSubscription, storeCurrency }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Basic Info
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [nameKu, setNameKu] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionKu, setDescriptionKu] = useState('');
    const [showEn, setShowEn] = useState(false);
    const [showKu, setShowKu] = useState(false);
    const [price, setPrice] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [isAvailable, setIsAvailable] = useState(true);
    const [displayOrder, setDisplayOrder] = useState('0');
    const [sku, setSku] = useState('');
    const [simpleStockQuantity, setSimpleStockQuantity] = useState('0');

    // Layout State
    const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'settings'>('basic');

    // Variants
    const [hasVariants, setHasVariants] = useState(false);
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || '');
                setNameEn(initialData.name_en || '');
                setNameKu(initialData.name_ku || '');
                setDescription(initialData.description || '');
                setDescriptionEn(initialData.description_en || '');
                setDescriptionKu(initialData.description_ku || '');
                setShowEn(!!initialData.name_en || !!initialData.description_en);
                setShowKu(!!initialData.name_ku || !!initialData.description_ku);
                setPrice(initialData.price?.toString() || '');
                setSectionId(initialData.section_id || (sections.length > 0 ? sections[0].id : ''));
                setImageUrl(initialData.image_url || '');
                setAdditionalImages((initialData.attributes as any)?.images || []);

                const attrs = initialData.attributes;
                setIsAvailable(attrs?.isAvailable ?? true);
                setHasVariants(attrs?.hasVariants || false);
                setVariantOptions(attrs?.variantOptions || []);
                setVariantCombinations(attrs?.variantCombinations || []);
                setDisplayOrder(initialData.display_order?.toString() || '0');
                setSku((initialData as any).sku || '');
                setSimpleStockQuantity(initialData.stock_quantity?.toString() || '0');
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
                price: existing ? existing.price : '', // preserve price if combo existed
                stock_quantity: existing ? existing.stock_quantity : '0', // New: preserve stock if combo existed
                isUnavailable: existing ? existing.isUnavailable : false // preserve availability if combo existed
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

    const toggleCombinationAvailability = (comboId: string) => {
        setVariantCombinations(prev => prev.map(c => c.id === comboId ? { ...c, isUnavailable: !c.isUnavailable } : c));
    };

    const updateCombinationStock = (comboId: string, stock: string) => {
        setVariantCombinations(prev => prev.map(c => c.id === comboId ? { ...c, stock_quantity: stock } : c));
    };

    // --- Media Upload ---
    const { plan } = useFeatureGate(storeId);
    const MAX_IMAGES = plan.allow_multiple_product_images ? 5 : 1;
    const allImages = [imageUrl, ...additionalImages].filter(Boolean);
    const canAddMore = allImages.length < MAX_IMAGES;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Allow up to 10MB initial size since we compress it down anyway
        if (file.size > 10 * 1024 * 1024) {
            setError('حجم الصورة كبير جداً (الحد الأقصى 10MB).');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            // Compress image
            const options = {
                maxSizeMB: 0.8, // Maximum 800KB
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                fileType: 'image/webp', // Convert to WebP for better performance
            };
            const compressedFile = await imageCompression(file, options);

            // Use webp extension since we requested webp
            const fileExt = compressedFile.type.split('/')[1] || 'webp';
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            let bucket = 'product_images';
            let uploadResult = await supabase.storage.from(bucket).upload(filePath, compressedFile);

            if (uploadResult.error) {
                console.warn('Fallback to store-assets bucket');
                bucket = 'store-assets';
                uploadResult = await supabase.storage.from(bucket).upload(filePath, compressedFile);
                if (uploadResult.error) throw uploadResult.error;
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
        setNameEn('');
        setNameKu('');
        setDescription('');
        setDescriptionEn('');
        setDescriptionKu('');
        setPrice('');
        setSectionId(sections.length > 0 ? sections[0].id : '');
        setImageUrl('');
        setAdditionalImages([]);
        setIsAvailable(true);
        setHasVariants(false);
        setVariantOptions([]);
        setVariantCombinations([]);
        setDisplayOrder('0');
        setSku('');
        setSimpleStockQuantity('0');
        setShowEn(false);
        setShowKu(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!name.trim()) throw new Error('يرجى إدخال اسم المنتج.');
            if (!price || parseFloat(price) <= 0) throw new Error('يرجى إدخال السعر الأساسي للمنتج.');
            if (!sectionId) throw new Error('يرجى اختيار قسم للمنتج.');

            const totalStock = hasVariants 
                ? variantCombinations.reduce((acc, c) => acc + (parseInt(c.stock_quantity) || 0), 0)
                : (isAvailable ? (parseInt(simpleStockQuantity) || 0) : 0);

            const prevAttrs = initialData?.attributes as any || {};
            const outOfStockSince = totalStock === 0 
                ? (prevAttrs.out_of_stock_since || new Date().toISOString()) 
                : null;

            const attributes: any = {
                hasVariants,
                variantOptions: hasVariants ? variantOptions.filter(o => o.name && o.values.length > 0) : [],
                variantCombinations: hasVariants ? variantCombinations : [],
                isAvailable,
                images: additionalImages,
                out_of_stock_since: outOfStockSince
            };

            const productData = {
                store_id: storeId,
                name,
                name_en: nameEn.trim() || null,
                name_ku: nameKu.trim() || null,
                description,
                description_en: descriptionEn.trim() || null,
                description_ku: descriptionKu.trim() || null,
                price: parseFloat(price || '0'),
                section_id: sectionId,
                stock_quantity: totalStock, 
                image_url: imageUrl,
                display_order: parseInt(displayOrder) || 0,
                sku: sku.trim() || null,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all p-4 lg:p-0" dir="rtl">
            <div className="flex flex-col lg:flex-row items-start gap-6 max-w-[1200px] w-full h-[90vh] lg:h-[800px]">
                
                {/* Main Modal (Centered) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="flex-1 bg-white h-full shadow-[0_32px_120px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex flex-col border border-white/20 relative overflow-hidden"
                >
                {/* Abstract Background Decor */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Header & Tab Navigation */}
                <div className="bg-white border-b border-slate-100 flex flex-col sticky top-0 z-30">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-black flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">
                                    {initialData ? '✎' : '+'}
                                </div>
                                {initialData ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-black hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Premium Segmented Control Tabs */}
                    <div className="px-6 pb-4">
                        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50">
                            {[
                                { id: 'basic', label: 'المعلومات الأساسية', icon: '📝' },
                                { id: 'variants', label: 'الأسعار والمتغيرات', icon: '💎' },
                                { id: 'settings', label: 'الإعدادات والتنظيم', icon: '⚙️' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black transition-all relative ${activeTab === tab.id ? 'bg-white text-black shadow-sm border border-slate-100' : 'text-black hover:text-black'}`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTabUnderline" className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {activeTab === 'basic' && (
                            <motion.div 
                                key="basic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >

                            {/* Basic Details Card */}
                            <div className="bg-white rounded-[2rem] p-4 lg:p-6 border border-slate-200/60 shadow-sm space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-black text-black">صور المنتج</label>
                                            {!plan.allow_multiple_product_images && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">صور متعددة في الذهبي</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-black">{allImages.length}/{MAX_IMAGES}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {allImages.map((url, idx) => (
                                            <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 group flex-shrink-0">
                                                <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                                                {idx === 0 && <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-indigo-600 text-white text-[6px] font-black rounded uppercase">رئيسية</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(url)}
                                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-white/90 backdrop-blur-md text-rose-500 rounded flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {canAddMore && (
                                            <div className="relative w-16 h-16 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer flex-shrink-0">
                                                {uploading ? (
                                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-5 h-5 text-slate-900 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" title="أضف صورة" />
                                            </div>
                                        )}
                                        {!canAddMore && !plan.allow_multiple_product_images && (
                                            <div className="relative w-16 h-16 rounded-lg bg-orange-50 border border-dashed border-orange-200 flex flex-col items-center justify-center text-center p-1 opacity-80 flex-shrink-0" title="الترقية مطلوبة لتخطي الحد المسموح">
                                                <svg className="w-4 h-4 text-orange-400 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                <span className="text-[6px] font-bold text-orange-600 uppercase leading-tight">للذهبي</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-black font-medium">الصورة الأولى هي الرئيسية. أضف حتى {MAX_IMAGES} {MAX_IMAGES === 1 ? 'صورة' : 'صور'} (PNG, JPG — حتى 2MB).</p>
                                </div>

                                {/* Premium Language Segmented Control */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">اللغات الإضافية (اختياري)</label>
                                    <div className="flex p-1 bg-slate-100/50 backdrop-blur-sm rounded-xl border border-slate-200">
                                        <button 
                                            type="button"
                                            onClick={() => setShowEn(!showEn)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-black transition-all ${showEn ? 'bg-white text-black shadow-sm border border-slate-100 scale-[0.98]' : 'text-black hover:text-black'}`}
                                        >
                                            <span className="uppercase">English (EN)</span>
                                            {showEn && <motion.div layoutId="dotEn" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 self-center mx-1" />
                                        <button 
                                            type="button"
                                            onClick={() => setShowKu(!showKu)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-black transition-all ${showKu ? 'bg-white text-black shadow-sm border border-slate-100 scale-[0.98]' : 'text-black hover:text-black'}`}
                                        >
                                            <span>کوردی (KU)</span>
                                            {showKu && <motion.div layoutId="dotKu" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">اسم المنتج (عربي)</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قميص قطني فاخر" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-black placeholder:text-black focus:bg-white focus:border-indigo-500 transition-all outline-none" required />
                                    </div>

                                    {showEn && (
                                        <div className="space-y-2" dir="ltr">
                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">Product Name (EN)</label>
                                            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Premium Cotton Shirt" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-black placeholder:text-black focus:bg-white focus:border-indigo-500 transition-all outline-none" />
                                        </div>
                                    )}

                                    {showKu && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">ناوى بەرهەم (کوردی)</label>
                                            <input type="text" value={nameKu} onChange={(e) => setNameKu(e.target.value)} placeholder="وەک: تیشێرتى لۆکەى نایاب" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-black placeholder:text-black focus:bg-white focus:border-indigo-500 transition-all outline-none text-right" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-1">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">الوصف والمواصفات</label>
                                    <div className="space-y-2">
                                        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف بالعربي..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black placeholder:text-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none" />
                                        
                                        {showEn && (
                                            <textarea rows={2} dir="ltr" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Description in English..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black placeholder:text-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none" />
                                        )}
                                        
                                        {showKu && (
                                            <textarea rows={2} value={descriptionKu} onChange={(e) => setDescriptionKu(e.target.value)} placeholder="وەسف بە زمانی کوردي..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black placeholder:text-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none text-right" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'variants' && (
                            <motion.div 
                                key="variants"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Technical Specifications (SKU & Price) */}
                                <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 border border-slate-200/60 shadow-sm space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        <h3 className="text-sm font-black text-black">المواصفات الفنية والأسعار</h3>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* SKU */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest">رمز المنتج (SKU)</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setSku(`SKU-${Math.floor(Math.random() * 90000) + 10000}`)}
                                                    className="text-[9px] font-black text-black hover:text-indigo-800 transition-colors uppercase"
                                                >
                                                    توليد ذكي
                                                </button>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={sku} 
                                                onChange={(e) => setSku(e.target.value)} 
                                                placeholder="e.g. TAJER-PRD-001" 
                                                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-black placeholder:text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none" 
                                                dir="ltr"
                                            />
                                        </div>

                                        {/* Base Price */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">السعر الأساسي ({storeCurrency})</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-900 transition-colors">{storeCurrency === 'USD' ? '$' : 'د.ع'}</span>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    value={price} 
                                                    onChange={(e) => setPrice(e.target.value)} 
                                                    placeholder="0.00" 
                                                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-bold text-black focus:bg-white focus:border-indigo-500 transition-all outline-none" 
                                                    dir="ltr" 
                                                />
                                            </div>
                                        </div>

                                        {!hasVariants && (
                                            /* Stock Quantity for simple products */
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">الكمية المتوفرة</label>
                                                <div className="relative group">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        value={simpleStockQuantity} 
                                                        onChange={(e) => setSimpleStockQuantity(e.target.value)} 
                                                        placeholder="0" 
                                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-black focus:bg-white focus:border-indigo-500 transition-all outline-none" 
                                                        dir="ltr" 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-[10px] text-emerald-700 font-bold leading-tight">سيتم استخدام السعر الأساسي إذا لم تقم بتحديد أسعار مخصصة للمتغيرات (Variants).</p>
                                    </div>
                                </div>

                                {/* Variants Matrix Card */}
                                <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="p-5 lg:p-8 border-b border-slate-100 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-black flex items-center justify-center">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                </div>
                                                <h3 className="text-sm font-black text-black">المتغيرات (Variants)</h3>
                                            </div>
                                            <p className="text-[10px] text-black mt-2 font-medium">أضف خيارات مثل المقاس أو اللون. هذه الحقول لن تؤثر على المخزون (كتالوج فقط).</p>
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
                                        <div className="p-4 lg:p-8 space-y-8 bg-slate-50/50">
                                            {/* Options Builder */}
                                            <div className="space-y-4">
                                                {variantOptions.map((option, idx) => (
                                                    <div key={option.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 relative group">
                                                        <button onClick={() => removeOption(option.id)} className="absolute top-4 left-4 w-6 h-6 bg-slate-100 text-black rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">اسم الخيار {idx + 1}</label>
                                                            <input type="text" value={option.name} onChange={(e) => updateOptionName(option.id, e.target.value)} placeholder="مثال: الحجم، اللون، المقاس" className="w-full lg:w-1/2 h-10 border-b-2 border-slate-100 bg-transparent px-2 text-sm font-bold text-black focus:border-indigo-500 transition-colors outline-none" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">القيم المتاحة</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {option.values.map(val => {
                                                                    const isColorOption = option.name === 'اللون';
                                                                    const isHex = isColorOption && val.startsWith('#');
                                                                    return (
                                                                        <div key={val} className={`px-3 py-1.5 bg-slate-100 text-black font-bold text-xs rounded-lg flex items-center gap-2 ${isHex ? 'pl-2' : ''}`}>
                                                                            {isHex ? (
                                                                                <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: val }} title="لون" />
                                                                            ) : (
                                                                                <span>{val}</span>
                                                                            )}
                                                                            <button onClick={() => removeOptionValue(option.id, val)} className="text-black hover:text-rose-500">×</button>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {option.name === 'اللون' ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input type="color" id={`color-picker-${option.id}`} className="w-9 h-9 border-0 cursor-pointer" defaultValue="#3b82f6" />
                                                                        <button onClick={() => { const ci = document.getElementById(`color-picker-${option.id}`) as HTMLInputElement; if (ci) addOptionValue(option.id, ci.value.toUpperCase()); }} className="h-9 px-3 bg-indigo-600 rounded-lg text-[10px] font-black text-white hover:bg-indigo-700">أضف</button>
                                                                    </div>
                                                                ) : (
                                                                    <input type="text" placeholder="أضف قيمة..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOptionValue(option.id, e.currentTarget.value); e.currentTarget.value = ''; } }} className="h-9 min-w-[120px] bg-slate-50 border border-slate-200 border-dashed rounded-lg px-3 text-xs font-bold text-black focus:bg-white focus:border-indigo-500 outline-none transition-all" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {/* Quick Templates */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest px-1 flex items-center gap-2">
                                                    <span>قوالب جاهزة (Quick Templates)</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                </label>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {[
                                                        { title: 'مقاسات ملابس', name: 'المقاس', values: ['S', 'M', 'L', 'XL', 'XXL'], icon: '👕' },
                                                        { title: 'مقاسات أحذية', name: 'المقاس', values: ['40', '41', '42', '43', '44', '45'], icon: '👟' },
                                                        { title: 'ألوان أساسية', name: 'اللون', values: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#008000'], icon: '🎨' },
                                                        { title: 'أوزان شائعة', name: 'الوزن', values: ['250g', '500g', '1kg', '2kg'], icon: '⚖️' }
                                                    ].map((preset) => (
                                                        <button 
                                                            key={preset.title}
                                                            type="button"
                                                            onClick={() => addOption(preset.name, preset.values)}
                                                            className="flex flex-col items-center gap-1.5 p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                                                        >
                                                            <span className="text-xl group-hover:scale-125 transition-transform">{preset.icon}</span>
                                                            <span className="text-[10px] font-black text-black">{preset.title}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={() => addOption()} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-black hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                إضافة خيار مخصص
                                            </button>
                                            </div>

                                            {/* Combinations Matrix */}
                                            {variantCombinations.length > 0 && (
                                                <div className="space-y-4 pt-8 border-t border-slate-200">
                                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                                        <table className="w-full text-right text-xs font-bold">
                                                            <thead className="bg-slate-50/50 border-b border-slate-200 text-black">
                                                                <tr>
                                                                    <th className="px-5 py-4 font-black uppercase text-[9px]">توليفة الخيارات</th>
                                                                    <th className="px-5 py-4 font-black uppercase text-[9px]">السعر</th>
                                                                    <th className="px-5 py-4 font-black uppercase text-[9px]">الكمية</th>
                                                                    <th className="px-5 py-4 font-black uppercase text-[9px] text-center">التوفر</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                <AnimatePresence>
                                                                    {variantCombinations.map((combo) => (
                                                                        <motion.tr key={combo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-indigo-50/30 transition-colors">
                                                                            <td className="px-5 py-3 text-black">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {Object.entries(combo.options).map(([optId, val]) => {
                                                                                        const isHex = val.startsWith('#') && (val.length === 7 || val.length === 4);
                                                                                        return (
                                                                                            <span key={optId} className={`px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-black shadow-sm flex items-center gap-1.5 ${isHex ? 'min-w-[28px] justify-center' : ''}`}>
                                                                                                {isHex ? (
                                                                                                    <div className="w-3 h-3 rounded-full border border-slate-100" style={{ backgroundColor: val }} title={val} />
                                                                                                ) : (
                                                                                                    val
                                                                                                )}
                                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-2">
                                                                                <input type="number" placeholder={price || "0"} value={combo.price} onChange={(e) => updateCombinationPrice(combo.id, e.target.value)} className="w-24 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-black text-black outline-none focus:border-indigo-500 transition-all" dir="ltr" />
                                                                            </td>
                                                                            <td className="px-5 py-2">
                                                                                <input type="number" min="0" value={combo.stock_quantity} onChange={(e) => updateCombinationStock(combo.id, e.target.value)} className="w-20 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-black text-black outline-none focus:border-indigo-500 transition-all" dir="ltr" />
                                                                            </td>
                                                                            <td className="px-5 py-2 text-center">
                                                                                <button type="button" onClick={() => toggleCombinationAvailability(combo.id)} className={`w-10 h-5 rounded-full relative transition-all ${!combo.isUnavailable ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${!combo.isUnavailable ? 'right-6' : 'right-1'}`} /></button>
                                                                            </td>
                                                                        </motion.tr>
                                                                    ))}
                                                                </AnimatePresence>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div 
                                key="settings"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Organization Card */}
                                <div className="bg-white rounded-[2rem] p-5 lg:p-6 border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-black flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                        </div>
                                        <h3 className="text-sm font-black text-black">التنظيم والتصنيف</h3>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">القسم الرئيسي</label>
                                            <div className="relative group">
                                                <select 
                                                    value={sectionId} 
                                                    onChange={(e) => setSectionId(e.target.value)} 
                                                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-black appearance-none outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                                                >
                                                    <option value="" disabled>اختر القسم</option>
                                                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                                                </select>
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black uppercase tracking-widest px-1">ترتيب العرض</label>
                                            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="0" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-black focus:bg-white focus:border-indigo-500 transition-all outline-none" />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-black uppercase">حالة التوفر</span>
                                            <p className="text-xs font-bold text-black">{isAvailable ? 'متاح حالياً' : 'غير متوفر'}</p>
                                        </div>
                                        <button type="button" onClick={() => setIsAvailable(!isAvailable)} className={`w-12 h-6 rounded-full transition-all relative ${isAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${isAvailable ? 'right-7' : 'right-1'}`} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-30">
                    <button onClick={onClose} className="px-6 py-3 text-black font-bold hover:text-black text-xs transition-colors">إلغاء</button>
                    <div className="flex items-center gap-3">
                        {activeTab !== 'settings' && (
                            <button onClick={() => setActiveTab(activeTab === 'basic' ? 'variants' : 'settings')} className="px-6 py-3 bg-slate-100 text-black rounded-xl font-black text-xs hover:bg-slate-200 transition-all flex items-center gap-2">الخطوة التالية <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        )}
                        <button onClick={handleSubmit} disabled={loading || uploading} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">{loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>{initialData ? 'حفظ التعديلات' : 'إضافة المنتج'}</span>}</button>
                    </div>
                </div>
            </motion.div>

            {/* Sidebar: Fixed Live Preview (Desktop Only) */}
            <div className="hidden lg:flex w-80 h-full flex-col gap-6 sticky top-0">
                <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-7 border border-white shadow-2xl space-y-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-50 text-black flex items-center justify-center text-2xl mb-2 shadow-inner">👁️</div>
                    <h3 className="text-[11px] font-black text-black uppercase tracking-widest relative z-10">المعاينة المباشرة</h3>
                    <p className="text-[9px] text-black font-bold leading-relaxed px-4 relative z-10">شكل المنتج النهائي للمشترين</p>
                    
                    <div className="w-full mt-4 relative z-10">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden text-right">
                            <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200 font-black text-[10px] uppercase tracking-widest">بانتظار الصورة</div>}
                                <div className="absolute top-4 right-4 px-2.5 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black">{isAvailable ? 'متوفر' : 'غير متوفر'}</div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-black text-black text-sm line-clamp-1">{name || 'اسم المنتج...'}</h4>
                                    <p className="text-[10px] text-black line-clamp-1">{sections.find(s => s.id === sectionId)?.name || 'القسم...'}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <div className="flex flex-col"><span className="text-[10px] font-bold text-black leading-none mb-1">السعر</span><span className="text-base font-black text-black">{price || '0'} {storeCurrency}</span></div>
                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs">＋</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            ` }} />
            </div>
        </div>
    );
}
