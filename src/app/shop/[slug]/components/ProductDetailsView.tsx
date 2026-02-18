'use client';

import React, { useState } from 'react';

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
        outOfStockBehavior?: 'hide' | 'show_badge';
        options?: {
            sizes?: string[];
            colors?: string[];
            weights?: { value: string; unit: string }[];
        };
        weightPrices?: Record<string, string>;
    };
}

interface ProductDetailsViewProps {
    product: Product;
    onBack: () => void;
    onAddToCart: (product: any) => void;
}

export default function ProductDetailsView({ product, onBack, onAddToCart }: ProductDetailsViewProps) {
    const attributes = product.attributes;
    const hasVariants = attributes?.hasVariants;
    const options = attributes?.options;

    const [selectedColor, setSelectedColor] = useState(options?.colors?.[0] || '');
    const [selectedSize, setSelectedSize] = useState(options?.sizes?.[0] || '');
    const [selectedWeight, setSelectedWeight] = useState(
        options?.weights?.[0] ? `${options.weights[0].value}${options.weights[0].unit}` : ''
    );
    const [quantity, setQuantity] = useState(1);

    const isAvailable = attributes?.isAvailable !== false;
    const showBadge = attributes?.outOfStockBehavior === 'show_badge';

    // Calculate dynamic price based on weight override
    const getDisplayPrice = () => {
        if (selectedWeight && attributes?.weightPrices?.[selectedWeight]) {
            return parseFloat(attributes.weightPrices[selectedWeight]);
        }
        return product.price;
    };

    const displayPrice = getDisplayPrice();

    return (
        <div className="min-h-screen bg-white text-right pb-32 animate-in slide-in-from-left duration-500" dir="rtl">
            {/* Floating Header */}
            <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 border border-slate-100"
                >
                    <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
                <div className="flex gap-4">
                    <button className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 border border-slate-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 border border-slate-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Image Gallery Mock */}
            <div className="relative aspect-square bg-[#F2F4F7] flex items-center justify-center">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                {/* Dots */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-2.5 h-1.5 rounded-full bg-slate-300"></div>
                    <div className="w-5 h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="w-2.5 h-1.5 rounded-full bg-slate-300"></div>
                </div>
            </div>

            {/* Product Info */}
            <div className="px-6 py-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[10px] font-bold rounded-lg uppercase tracking-wider italic">وصل حديثاً</div>
                            {!isAvailable && showBadge && (
                                <div className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-lg uppercase tracking-wider italic">نفذ من المخزون</div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-slate-800 tracking-tighter">{displayPrice} ر.س</span>
                            {product.discount_price && !attributes?.weightPrices?.[selectedWeight] && (
                                <span className="text-sm font-bold text-slate-300 line-through">{product.discount_price} ر.س</span>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tighter leading-tight">{product.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                            <span>⭐ {product.rating || '4.8'}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">(120 تقييم)</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        {product.description || "هذا المنتج مصنوع من أجود الخامات العالمية لضمان الراحة والأداء المثالي للاستخدام اليومي."}
                    </p>
                </div>

                {hasVariants && (
                    <>
                        {/* Color Multi-Select */}
                        {options?.colors && options.colors.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">اختر اللون</h3>
                                <div className="flex gap-4">
                                    {options.colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            style={{ backgroundColor: color }}
                                            className={`w-10 h-10 rounded-full border-4 transition-all ${color.toUpperCase() === '#FFFFFF' ? 'border-slate-200' : 'border-transparent'} ${selectedColor === color ? 'border-emerald-500 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'}`}
                                        ></button>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedColor}</p>
                            </div>
                        )}

                        {/* Size Multi-Select */}
                        {options?.sizes && options.sizes.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800">اختر المقاس</h3>
                                    <button className="text-xs font-bold text-emerald-500 underline">جدول المقاسات</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {options.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[56px] h-12 rounded-xl border-2 font-bold text-sm transition-all ${selectedSize === size ? 'border-emerald-500 bg-emerald-50 text-emerald-500' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weight/Volume Multi-Select */}
                        {options?.weights && options.weights.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 italic">اختر الوزن/الحجم</h3>
                                <div className="flex flex-wrap gap-3">
                                    {options.weights.map((w, idx) => {
                                        const weightKey = `${w.value}${w.unit}`;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedWeight(weightKey)}
                                                className={`min-w-[80px] h-12 rounded-xl border-2 font-bold text-sm transition-all ${selectedWeight === weightKey ? 'border-emerald-500 bg-emerald-50 text-emerald-500' : 'border-slate-100 text-slate-400'}`}
                                            >
                                                {w.value} {w.unit}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Quantity */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">الكمية</h3>
                    <div className="inline-flex items-center bg-slate-50 rounded-2xl p-2 gap-6">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50">-</button>
                        <span className="text-sm font-bold text-slate-800 w-4 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50">+</button>
                    </div>
                </div>

                {/* Extra Details */}
                <div className="pt-8 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-xs cursor-pointer group">
                        <h4 className="font-bold text-slate-800 group-hover:text-emerald-500 transition-colors">تفاصيل إضافية</h4>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold">
                        <span className="text-slate-400">الخامة:</span>
                        <span className="text-slate-800">١٠٠٪ قطن طبيعي</span>
                        <span className="text-slate-400">بلد المنشأ:</span>
                        <span className="text-slate-800">المملكة العربية السعودية</span>
                        <span className="text-slate-400 italic">رقم الموديل:</span>
                        <span className="text-slate-800 uppercase">TSH-2024-WH</span>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action */}
            <div className={`fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 safe-area-bottom transition-all ${!isAvailable ? 'opacity-70' : ''}`}>
                <button
                    onClick={() => isAvailable && onAddToCart({ ...product, price: displayPrice, quantity, color: selectedColor, size: selectedSize, weight: selectedWeight })}
                    disabled={!isAvailable}
                    className={`w-full py-5 rounded-[2.5rem] font-black text-sm italic transition-all flex items-center justify-center gap-3 ${isAvailable
                            ? 'bg-[#00D084] text-white shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    <svg className="w-5 h-5 leading-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {isAvailable ? 'إضافة للسلة' : 'نفذ من المخزون'}
                </button>
            </div>
        </div>
    );
}
