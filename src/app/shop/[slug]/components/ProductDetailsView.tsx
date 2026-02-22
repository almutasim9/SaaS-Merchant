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
        variantOptions?: VariantOption[];
        variantCombinations?: VariantCombination[];
        images?: string[];
    };
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

    // Base availability check (Catalog mode assumes always available if active)
    const isAvailable = attributes?.isAvailable !== false;

    // Initialize selected options to the first value of each option type
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Build gallery images array: primary + additional
    const galleryImages = useMemo(() => {
        const imgs = [product.image_url].filter(Boolean);
        if (attributes?.images && Array.isArray(attributes.images)) {
            imgs.push(...attributes.images.filter(Boolean));
        }
        return imgs.length > 0 ? imgs : ['/placeholder-product.png'];
    }, [product.image_url, attributes?.images]);

    // Touch swipe handlers
    const [touchStart, setTouchStart] = useState<number | null>(null);

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

    // Calculate dynamic price based on the selected combination
    const displayPrice = useMemo(() => {
        if (!hasVariants || variantCombinations.length === 0) {
            return product.price;
        }

        // Generate comboId from current selected options
        const sortedKeys = Object.keys(selectedOptions).sort();
        const comboId = sortedKeys.map(k => `${k}:${selectedOptions[k]}`).join('|');

        const combo = variantCombinations.find(c => c.id === comboId);
        if (combo && combo.price && parseFloat(combo.price) > 0) {
            return parseFloat(combo.price);
        }

        return product.price;
    }, [selectedOptions, hasVariants, variantCombinations, product.price]);

    const handleAddToCart = () => {
        if (!isAvailable) return;

        // Build a human-readable selections object for the cart
        const humanSelections: Record<string, string> = {};
        Object.entries(selectedOptions).forEach(([optId, val]) => {
            const optName = variantOptions.find(o => o.id === optId)?.name || 'متغير';
            humanSelections[optName] = val;
        });

        onAddToCart({
            ...product,
            price: displayPrice,
            quantity,
            selections: humanSelections // Pass the selected combination to cart
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="min-h-screen bg-white text-right pb-32 lg:pb-0 lg:flex lg:flex-row lg:h-screen lg:overflow-hidden animate-in slide-in-from-left duration-500" dir="rtl">
            {/* Desktop Close Button */}
            <button
                onClick={onBack}
                className="hidden lg:flex absolute top-8 right-8 z-50 w-12 h-12 bg-white shadow-xl rounded-full items-center justify-center text-slate-800 hover:scale-105 transition-all outline-none"
            >
                <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>

            {/* Floating Header - Mobile Only */}
            <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between lg:hidden">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 border border-slate-100"
                >
                    <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>

                {storeLogo && (
                    <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 p-1">
                        <img src={storeLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                )}
            </header>

            {/* Image Gallery */}
            <div className="relative aspect-square lg:aspect-auto lg:w-1/2 lg:h-full bg-[#F2F4F7] flex items-center justify-center overflow-hidden"
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
                <Image
                    src={galleryImages[currentImageIndex]}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover transition-all duration-500"
                    key={currentImageIndex}
                />

                {/* Gallery Navigation Arrows (Desktop) */}
                {galleryImages.length > 1 && (
                    <>
                        {currentImageIndex > 0 && (
                            <button
                                onClick={() => setCurrentImageIndex(prev => prev - 1)}
                                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center text-slate-600 hover:bg-white hover:scale-110 transition-all shadow-lg z-10"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                        {currentImageIndex < galleryImages.length - 1 && (
                            <button
                                onClick={() => setCurrentImageIndex(prev => prev + 1)}
                                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center text-slate-600 hover:bg-white hover:scale-110 transition-all shadow-lg z-10"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                    </>
                )}

                {/* Dot Indicators */}
                {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
                        {galleryImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`transition-all rounded-full ${idx === currentImageIndex ? 'w-5 h-2 bg-indigo-600' : 'w-2 h-2 bg-slate-400/60 hover:bg-slate-500'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Thumbnail strip (Desktop) */}
                {galleryImages.length > 1 && (
                    <div className="hidden lg:flex absolute bottom-6 left-6 gap-2 z-10">
                        {galleryImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-indigo-600 scale-110 shadow-xl' : 'border-white/60 opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="px-6 py-8 lg:px-16 lg:py-16 space-y-8 lg:w-1/2 lg:overflow-y-auto no-scrollbar relative">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {!isAvailable && (
                                <div className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">غير متاح حالياً</div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tighter">{displayPrice} د.ع</span>
                            {product.discount_price && displayPrice === product.price && (
                                <span className="text-sm font-bold text-slate-400 line-through">{product.discount_price} د.ع</span>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter leading-tight pt-2 lg:pt-4">{product.name}</h1>

                    <p className="text-sm lg:text-base font-medium text-slate-500 leading-relaxed pt-2">
                        {product.description || "هذا المنتج مصنوع من أجود الخامات العالمية لضمان الراحة والأداء المثالي للاستخدام اليومي."}
                    </p>
                </div>

                {hasVariants && variantOptions.length > 0 && (
                    <div className="space-y-8 py-4">
                        {variantOptions.map((opt) => (
                            <div key={opt.id} className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">اختر {opt.name}</h3>
                                <div className="flex flex-wrap gap-3">
                                    {opt.values.map((val) => {
                                        const isColorOption = opt.name === 'اللون';
                                        const isHex = isColorOption && val.startsWith('#');
                                        const isSelected = selectedOptions[opt.id] === val;

                                        if (isHex) {
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: val }))}
                                                    className={`w-12 h-12 rounded-full border-2 transition-all p-1 flex items-center justify-center ${isSelected ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                    title={val}
                                                >
                                                    <div className="w-full h-full rounded-full border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" style={{ backgroundColor: val }} />
                                                </button>
                                            );
                                        }

                                        return (
                                            <button
                                                key={val}
                                                onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: val }))}
                                                className={`min-w-[56px] px-5 h-12 rounded-xl border-2 font-bold text-sm transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
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

                {/* Quantity */}
                <div className="space-y-4 pb-8">
                    <h3 className="text-sm font-bold text-slate-800">الكمية</h3>
                    <div className="inline-flex items-center bg-slate-50 rounded-2xl p-2 gap-6">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">-</button>
                        <span className="text-sm font-bold text-slate-800 w-4 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">+</button>
                    </div>
                </div>

                {/* Desktop Sticky Action OR Mobile Bottom Action */}
                <div className={`fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 safe-area-bottom transition-all lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:p-0 mt-8 ${!isAvailable ? 'opacity-70' : ''}`}>
                    <button
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                        className={`w-full py-5 rounded-[2.5rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${!isAvailable
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isAdded
                                ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 scale-100'
                                : 'bg-[#00D084] text-white shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
                            }`}
                    >
                        {!isAvailable ? (
                            <>
                                <svg className="w-5 h-5 leading-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                غير متاح
                            </>
                        ) : isAdded ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-bottom-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                تمت الإضافة للسلة بنجاح
                            </div>
                        ) : (
                            <>
                                <svg className="w-5 h-5 leading-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                إضافة للسلة
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
