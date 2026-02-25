'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getSections } from '../../sections/actions';

export default function AddProductPage() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '', // Base price
        section_id: '',
        isAvailable: true, // Catalog-only: Available or Out of Stock
        outOfStockBehavior: 'hide' as 'hide' | 'show_badge',
        image_url: '',
        hasVariants: false,
        options: {
            sizes: [] as string[],
            colors: [] as string[],
            weights: [] as { value: string; unit: string }[]
        },
        weightPrices: {} as Record<string, string> // weight_unit -> price string
    });
    const [sections, setSections] = useState<any[]>([]);

    const router = useRouter();

    useEffect(() => {
        checkMerchant();
    }, []);

    const checkMerchant = async () => {
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

        if (profile?.role !== 'merchant') {
            router.push('/login');
            return;
        }

        const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', user.id)
            .single();

        if (storeData) {
            setStoreId(storeData.id);
            setIsAdmin(true);
            const sectionsData = await getSections(storeData.id);
            setSections(sectionsData);
            if (sectionsData.length > 0) {
                setFormData(prev => ({ ...prev, section_id: sectionsData[0].id }));
            }
        } else {
            setError('لم يتم العثور على متجر لهذا الحساب.');
        }
    };

    const MAX_IMAGES = 5;
    const allImages = [formData.image_url, ...additionalImages].filter(Boolean);
    const canAddMore = allImages.length < MAX_IMAGES;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('store-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-assets')
                .getPublicUrl(filePath);

            if (!formData.image_url) {
                setFormData(prev => ({ ...prev, image_url: publicUrl }));
            } else {
                setAdditionalImages(prev => [...prev, publicUrl]);
            }
        } catch (err: any) {
            setError('فشل رفع الصورة. تأكد من إعداد صلاحيات التخزين.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (url: string) => {
        if (url === formData.image_url) {
            if (additionalImages.length > 0) {
                setFormData(prev => ({ ...prev, image_url: additionalImages[0] }));
                setAdditionalImages(prev => prev.slice(1));
            } else {
                setFormData(prev => ({ ...prev, image_url: '' }));
            }
        } else {
            setAdditionalImages(prev => prev.filter(img => img !== url));
        }
    };

    const addOptionValue = (type: 'sizes' | 'colors', value: string) => {
        if (!value.trim()) return;
        if (formData.options[type].includes(value)) return;
        setFormData(prev => ({
            ...prev,
            options: {
                ...prev.options,
                [type]: [...prev.options[type], value]
            }
        }));
    };

    const addWeightVariant = (value: string, unit: string) => {
        if (!value.trim()) return;
        const weightStr = `${value}${unit}`;
        if (formData.options.weights.some(w => `${w.value}${w.unit}` === weightStr)) return;

        setFormData(prev => ({
            ...prev,
            options: {
                ...prev.options,
                weights: [...prev.options.weights, { value, unit }]
            }
        }));
    };

    const removeOptionValue = (type: 'sizes' | 'colors' | 'weights', index: number) => {
        setFormData(prev => {
            let weightKey = '';
            if (type === 'weights') {
                const w = prev.options.weights[index];
                weightKey = `${w.value}${w.unit}`;
            } else {
                weightKey = prev.options[type][index];
            }

            const newOptions = {
                ...prev.options,
                [type]: prev.options[type].filter((_, i) => i !== index)
            };

            // Cleanup price if weight removed
            const newWeightPrices = { ...prev.weightPrices };
            if (type === 'weights' || type === 'sizes' || type === 'colors') {
                delete newWeightPrices[weightKey];
            }

            return { ...prev, options: newOptions, weightPrices: newWeightPrices };
        });
    };

    const setWeightPrice = (weight: string, price: string) => {
        setFormData(prev => ({
            ...prev,
            weightPrices: { ...prev.weightPrices, [weight]: price }
        }));
    };

    const resetForm = () => {
        setFormData(prev => ({
            name: '',
            description: '',
            price: '',
            section_id: prev.section_id, // Preserve section
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
        }));
        setAdditionalImages([]);
        setSuccess(false);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        setLoading(true);
        setError(null);

        try {
            // Validation: Name, Price, and Section (category) are mandatory
            if (!formData.name.trim()) {
                throw new Error('يرجى إدخال اسم المنتج.');
            }
            if (!formData.price || parseFloat(formData.price) <= 0) {
                throw new Error('يرجى إدخال سعر صحيح للمنتج.');
            }
            if (!formData.section_id) {
                throw new Error('يرجى اختيار قسم للمنتج.');
            }

            const { error: insertError } = await supabase
                .from('products')
                .insert({
                    store_id: storeId,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price || '0'),
                    section_id: formData.section_id,
                    stock_quantity: formData.isAvailable ? 999 : 0, // Mock for backward compatibility
                    image_url: formData.image_url,
                    attributes: {
                        hasVariants: formData.hasVariants,
                        options: formData.options,
                        weightPrices: formData.weightPrices,
                        isAvailable: formData.isAvailable,
                        outOfStockBehavior: formData.outOfStockBehavior,
                        images: additionalImages
                    },
                });

            if (insertError) throw insertError;

            setSuccess(true);
            // Redirection removed for faster entry
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء حفظ المنتج.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-20 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Action Bar / Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-400 text-[10px] lg:text-xs font-bold">المنتجات</span>
                        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        <span className="text-slate-400 text-[10px] lg:text-xs font-bold">إضافة منتج جديد</span>
                    </div>
                    <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight">إضافة منتج جديد</h1>
                </div>

                <div className="flex items-center gap-3 lg:gap-4">
                    <button
                        onClick={() => router.push('/merchant/products')}
                        className="flex-1 lg:flex-none px-6 lg:px-8 py-3 lg:py-4 text-slate-500 font-black text-xs lg:text-sm hover:text-slate-800 transition-all"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        className="flex-1 lg:flex-none flex items-center gap-3 px-6 lg:px-8 py-3 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 min-w-[120px] lg:min-w-[160px] justify-center"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>جاري...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span>حفظ المنتج</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Area */}
            {(error || success) && (
                <div className={`p-6 rounded-[1.5rem] border ${success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'} animate-in fade-in slide-in-from-top-4 duration-500`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {success ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-black text-sm">{success ? 'تم حفظ المنتج بنجاح!' : 'حدث خطأ أثناء حفظ المنتج'}</p>
                            <p className="text-xs font-bold opacity-80 mt-1">{success ? 'ماذا تود أن تفعل الآن؟' : error}</p>

                            {success && (
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={resetForm}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                                    >
                                        إضافة منتج آخر
                                    </button>
                                    <button
                                        onClick={() => router.push('/merchant/products')}
                                        className="px-6 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all active:scale-95"
                                    >
                                        العودة للمنتجات
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                {/* Right Column - Main Info (2/3 width) */}
                <div className="lg:col-span-2 space-y-8 lg:space-y-10">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg lg:text-xl font-black text-slate-800">المعلومات الأساسية</h2>
                        </div>

                        <div className="p-6 lg:p-10 space-y-6 lg:space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المنتج <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="مثال: فستان صيفي قطني"
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">وصف المنتج</label>
                                <div className="bg-slate-50/50 border border-slate-100 rounded-xl lg:rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                    <div className="flex items-center gap-4 px-5 lg:px-6 py-3 border-b border-slate-100 bg-white/50">
                                        <button type="button" className="text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg></button>
                                        <button type="button" className="text-slate-800 font-black">B</button>
                                        <button type="button" className="text-slate-400 font-black">I</button>
                                        <div className="w-px h-4 bg-slate-200" />
                                        <button type="button" className="text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="اكتب وصفاً تفصيلياً لمنتجك هنا..."
                                        className="w-full bg-transparent px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base text-slate-800 focus:outline-none font-bold resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-black text-slate-800">المتغيرات (Variants)</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-400">تفعيل المتغيرات</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, hasVariants: !prev.hasVariants }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.hasVariants ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${formData.hasVariants ? 'right-7' : 'right-1'}`} />
                                </button>
                            </div>
                        </div>

                        {formData.hasVariants && (
                            <div className="p-10 space-y-10 animate-in fade-in slide-in-from-top-4 duration-300">
                                {/* Size Variant */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأحجام العالمية (Global Sizes)</label>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => {
                                            const isActive = formData.options.sizes.includes(size);
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isActive) {
                                                            const idx = formData.options.sizes.indexOf(size);
                                                            removeOptionValue('sizes', idx);
                                                        } else {
                                                            addOptionValue('sizes', size);
                                                        }
                                                    }}
                                                    className={`h-12 flex items-center justify-center rounded-xl font-black text-xs border transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="text"
                                            placeholder="+ أضف مقاس مخصص (مثال: 42)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addOptionValue('sizes', e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="h-12 w-full border border-slate-100 border-dashed rounded-xl px-4 text-slate-400 font-black text-[10px] focus:outline-none focus:border-indigo-100 hover:border-indigo-100 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Color Variant */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الألوان (Colors)</label>
                                        <span className="text-[10px] font-bold text-slate-300">اختر لوناً سريعاً أو أضف لوناً مخصصاً</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Color Presets */}
                                        {['#FFFFFF', '#000000', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#808080', '#FFA500', '#800080', '#FFC0CB'].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => addOptionValue('colors', preset)}
                                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 hover:scale-110 transition-transform active:scale-95"
                                                style={{ backgroundColor: preset }}
                                                title={preset}
                                            />
                                        ))}

                                        <div className="w-[1px] h-8 bg-slate-100 mx-2" />

                                        {formData.options.colors.map((color, idx) => (
                                            <div key={idx} className="group relative">
                                                <div
                                                    className="w-10 h-10 rounded-full border-4 border-white shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <button
                                                    onClick={() => removeOptionValue('colors', idx)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                                >×</button>
                                            </div>
                                        ))}
                                        <div className="relative group">
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-dashed flex items-center justify-center text-slate-300 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-all cursor-pointer">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <input
                                                type="color"
                                                onChange={(e) => addOptionValue('colors', e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Weight Variant */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأوزان والأحجام (Weights/Volumes)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {formData.options.weights.map((w, idx) => (
                                            <div key={idx} className="group relative">
                                                <div className="min-w-[80px] h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs border border-indigo-100 shadow-sm px-4">
                                                    {w.value} {w.unit}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeOptionValue('weights', idx)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="weight-value"
                                            type="text"
                                            placeholder="الكمية (مثال: 500)"
                                            className="h-12 flex-1 border border-slate-100 rounded-xl px-4 text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-100"
                                        />
                                        <select
                                            id="weight-unit"
                                            className="h-12 w-24 border border-slate-100 rounded-xl px-2 text-slate-800 font-bold text-sm focus:outline-none focus:border-indigo-100"
                                        >
                                            <option value="g">جم (g)</option>
                                            <option value="kg">كجم (kg)</option>
                                            <option value="ml">مل (ml)</option>
                                            <option value="L">لتر (L)</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const valEl = document.getElementById('weight-value') as HTMLInputElement;
                                                const unitEl = document.getElementById('weight-unit') as HTMLSelectElement;
                                                if (valEl.value) {
                                                    addWeightVariant(valEl.value, unitEl.value);
                                                    valEl.value = '';
                                                }
                                            }}
                                            className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-indigo-600 transition-all"
                                        >
                                            إضافة
                                        </button>
                                    </div>
                                </div>

                                {/* Weight Price Overrides */}
                                {formData.options.weights.length > 0 && (
                                    <div className="pt-6 border-t border-slate-50 space-y-6">
                                        <h3 className="text-sm font-black text-slate-800">أسعار الأوزان المخصصة</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.options.weights.map((w, idx) => {
                                                const weightKey = `${w.value}${w.unit}`;
                                                return (
                                                    <div key={idx} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                        <span className="text-xs font-black text-slate-400 min-w-[60px]">{w.value} {w.unit}</span>
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                placeholder="السعر (اختياري)"
                                                                value={formData.weightPrices[weightKey] || ''}
                                                                onChange={(e) => setWeightPrice(weightKey, e.target.value)}
                                                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                            />
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-black">د.ع</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!formData.hasVariants && (
                            <div className="p-20 text-center space-y-4 opacity-40">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">لا توجد متغيرات لهذا المنتج حالياً</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Column - Secondary Info (1/3 width) */}
                <div className="space-y-10">
                    {/* Image Upload Card */}
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg lg:text-xl font-black text-slate-800">صور المنتج</h2>
                            </div>
                            <span className="text-xs font-bold text-slate-400">{allImages.length}/{MAX_IMAGES}</span>
                        </div>

                        <div className="p-6 lg:p-10">
                            <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                                {allImages.map((url, idx) => (
                                    <div key={url} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-200 group">
                                        <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                                        {idx === 0 && <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-lg uppercase">رئيسية</span>}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(url)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur-md text-rose-500 rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {canAddMore && (
                                    <div className="relative aspect-square rounded-2xl bg-slate-50/50 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center group hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
                                        {uploading ? (
                                            <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <svg className="w-7 h-7 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span className="text-[9px] font-bold text-slate-400 mt-1">أضف صورة</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-4">الصورة الأولى هي الرئيسية في الكتالوج. أضف حتى {MAX_IMAGES} صور (PNG, JPG).</p>
                        </div>
                    </div>

                    {/* Pricing & Category Card */}
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center gap-4">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg lg:text-xl font-black text-slate-800">السعر والقسم</h2>
                        </div>

                        <div className="p-6 lg:p-10 space-y-6 lg:space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">سعر المنتج <span className="text-rose-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs lg:text-sm">د.ع</div>
                                    <input
                                        type="text"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl lg:rounded-2xl pl-14 lg:pl-16 pr-5 lg:pr-6 py-4 lg:py-5 text-slate-800 text-left focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black tracking-wider text-xl lg:text-3xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القسم <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={formData.section_id}
                                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none"
                                    >
                                        <option value="">اختر القسم</option>
                                        {sections.map(section => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                    <svg className="w-5 h-5 text-slate-300 absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-black text-slate-800">حالة توفر المنتج</span>
                                        <p className="text-[10px] text-slate-400 font-bold">هل المنتج متاح للطلب؟</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`w-12 h-7 rounded-full transition-all relative ${formData.isAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                        onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.isAvailable ? 'right-6' : 'right-1'}`} />
                                    </button>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">سلوك المنتج عند نفاذ الكمية</label>
                                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, outOfStockBehavior: 'hide' })}
                                            className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 text-right transition-all ${formData.outOfStockBehavior === 'hide' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <span className="block text-[10px] lg:text-xs font-black text-slate-800 mb-0.5">إخفاء</span>
                                            <span className="block text-[8px] lg:text-[10px] text-slate-400 font-bold leading-tight">سيختفي المنتج تماماً.</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, outOfStockBehavior: 'show_badge' })}
                                            className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 text-right transition-all ${formData.outOfStockBehavior === 'show_badge' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <span className="block text-[10px] lg:text-xs font-black text-slate-800 mb-0.5">إظهار علامة</span>
                                            <span className="block text-[8px] lg:text-[10px] text-slate-400 font-bold leading-tight">سيظهر كمنتهي.</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="text-center pt-20">
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">© 2024 لوحة التاجر - جميع الحقوق محفوظة</p>
            </footer>
        </div>
    );
}
