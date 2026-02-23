import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface VariantOption {
    id: string;
    name: string;
    values: string[];
}

interface VariantCombination {
    id: string;
    options: Record<string, string>;
    price: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    rating?: number;
    category: string;
    image_url: string;
    description: string;
    attributes?: {
        hasVariants?: boolean;
        isAvailable?: boolean;
        isHidden?: boolean;
        variantOptions?: VariantOption[];
        variantCombinations?: VariantCombination[];
        images?: string[];
    };
    hasVariants?: boolean;
    isAvailable?: boolean;
    variantOptions?: VariantOption[];
    variantCombinations?: VariantCombination[];
    images?: string[];
}

interface ProductDetailsViewProps {
    product: Product;
    onBack: () => void;
    onAddToCart: (product: any) => void;
    storeLogo?: string;
}

export default function ProductDetailsView({ product, onBack, onAddToCart, storeLogo }: ProductDetailsViewProps) {
    const attributes = product.attributes;
    const hasVariants = attributes?.hasVariants;
    const variantOptions = attributes?.variantOptions || [];
    const variantCombinations = attributes?.variantCombinations || [];
    const isAvailable = attributes?.isAvailable !== false;

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    // Build gallery
    const galleryImages = useMemo(() => {
        const imgs = [product.image_url].filter(Boolean);
        if (attributes?.images && Array.isArray(attributes.images)) {
            imgs.push(...attributes.images.filter(Boolean));
        }
        return imgs.length > 0 ? imgs : [];
    }, [product.image_url, attributes?.images]);

    // Initialize variant selections
    useEffect(() => {
        if (hasVariants && variantOptions.length > 0) {
            const initial: Record<string, string> = {};
            variantOptions.forEach(opt => {
                if (opt.values && opt.values.length > 0) {
                    initial[opt.id] = opt.values[0];
                }
            });
            setSelectedOptions(initial);
        }
    }, [hasVariants, variantOptions]);

    // Dynamic price
    const displayPrice = useMemo(() => {
        if (!hasVariants || variantCombinations.length === 0) return product.price;
        const sortedKeys = Object.keys(selectedOptions).sort();
        const comboId = sortedKeys.map(k => `${k}:${selectedOptions[k]}`).join('|');
        const combo = variantCombinations.find(c => c.id === comboId);
        if (combo && combo.price && parseFloat(combo.price) > 0) return parseFloat(combo.price);
        return product.price;
    }, [selectedOptions, hasVariants, variantCombinations, product.price]);

    const handleAddToCart = () => {
        if (!isAvailable) return;
        const humanSelections: Record<string, string> = {};
        Object.entries(selectedOptions).forEach(([optId, val]) => {
            const optName = variantOptions.find(o => o.id === optId)?.name || 'متغير';
            humanSelections[optName] = val;
        });
        onAddToCart({ ...product, price: displayPrice, quantity, selections: humanSelections });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="min-h-screen bg-white" dir="rtl">
            {/* ─── Image Gallery ─── */}
            <div
                className="relative w-full aspect-square bg-[#F2F4F7] overflow-hidden"
                onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                    if (touchStart === null) return;
                    const diff = touchStart - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 50) {
                        if (diff > 0 && currentImageIndex < galleryImages.length - 1) {
                            setCurrentImageIndex(prev => prev + 1);
                        } else if (diff < 0 && currentImageIndex > 0) {
                            setCurrentImageIndex(prev => prev - 1);
                        }
                    }
                    setTouchStart(null);
                }}
            >
                {galleryImages[currentImageIndex] ? (
                    <Image
                        src={galleryImages[currentImageIndex]}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover transition-all duration-500"
                        key={currentImageIndex}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}

                {/* Floating Controls */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all">
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all">
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Dot Indicators */}
                {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                        {galleryImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`transition-all rounded-full ${idx === currentImageIndex ? 'w-6 h-2' : 'w-2 h-2 bg-white/60'}`}
                                style={idx === currentImageIndex ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Product Info ─── */}
            <div className="px-5 pt-5 pb-32">
                {/* Rating + Name */}
                <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">{product.name}</h1>
                        <p className="text-sm text-slate-400 mt-0.5">{product.category}</p>
                    </div>
                    {product.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <span className="text-sm font-bold text-amber-600">{product.rating}</span>
                            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mt-3 mb-5">
                    <span className="text-3xl font-black text-slate-800">{displayPrice.toLocaleString()}</span>
                    <span className="text-base text-slate-400">د.ع</span>
                    {product.discount_price && product.discount_price < product.price && displayPrice === product.price && (
                        <span className="text-sm text-slate-400 line-through mr-2">{product.discount_price.toLocaleString()} د.ع</span>
                    )}
                </div>

                {/* Variants */}
                {hasVariants && variantOptions.length > 0 && (
                    <div className="space-y-5 mb-6">
                        {variantOptions.map((opt) => (
                            <div key={opt.id}>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">
                                    اختر {opt.name} <span className="text-slate-400 font-normal">({opt.name})</span>
                                </h3>
                                <div className="flex flex-wrap gap-2.5" dir="rtl">
                                    {opt.values.map((val) => {
                                        const isColorOption = opt.name === 'اللون';
                                        const isHex = isColorOption && val.startsWith('#');
                                        const isSelected = selectedOptions[opt.id] === val;

                                        if (isHex) {
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: val }))}
                                                    className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'scale-110 shadow-md' : 'border-slate-200 hover:scale-105'
                                                        }`}
                                                    style={isSelected ? { borderColor: 'var(--theme-primary)' } : undefined}
                                                >
                                                    <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: val }} />
                                                </button>
                                            );
                                        }

                                        return (
                                            <button
                                                key={val}
                                                onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: val }))}
                                                className={`min-w-[48px] px-4 h-11 rounded-xl border-2 font-bold text-sm transition-all ${isSelected
                                                    ? ''
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                style={isSelected ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' } : undefined}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Description */}
                <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-base font-bold text-slate-800 mb-3">وصف المنتج</h3>
                    <p className="text-sm text-slate-500 leading-7 whitespace-pre-line">
                        {product.description || 'هذا المنتج مصنوع من أجود الخامات العالمية لضمان الراحة والأداء المثالي للاستخدام اليومي.'}
                    </p>
                </div>

                {/* Unavailable Badge */}
                {!isAvailable && (
                    <div className="mt-5 bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                        <p className="text-sm font-bold text-rose-500">هذا المنتج غير متاح حالياً</p>
                    </div>
                )}
            </div>

            {/* ─── Fixed Bottom Bar ─── */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-5 py-4 z-50 safe-area-bottom">
                <div className="flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-12 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-lg font-bold"
                        >
                            −
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-800">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-12 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-lg font-bold"
                        >
                            +
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                        className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${!isAvailable
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'text-white hover:brightness-95 active:scale-[0.98]'
                            }`}
                        style={isAvailable ? (isAdded ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 85%, black)' } : { backgroundColor: 'var(--theme-primary)' }) : undefined}
                    >
                        {!isAvailable ? (
                            'غير متاح'
                        ) : isAdded ? (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                تمت الإضافة
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                إضافة إلى السلة
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
