import React, { useMemo, useRef } from 'react';
import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    rating?: number;
    is_featured?: boolean;
    category: string;
    image_url: string;
    description: string;
    attributes?: {
        hasVariants?: boolean;
        isAvailable?: boolean;
        isHidden?: boolean;
        variantCombinations?: { price: string }[];
    };
    hasVariants?: boolean;
    isAvailable?: boolean;
    outOfStockBehavior?: 'hide' | 'show_badge';
    variantCombinations?: { price: string }[];
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onClick?: (product: Product) => void;
}

function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
    const isUnavailable = product.attributes?.isAvailable === false || product.isAvailable === false;
    const hasVariants = product.attributes?.hasVariants || product.hasVariants;

    const displayPrice = useMemo(() => {
        if (hasVariants) {
            const combos = product.attributes?.variantCombinations || product.variantCombinations || [];
            if (combos.length > 0) {
                const prices = combos.map(c => parseFloat(c.price)).filter(p => !isNaN(p));
                if (prices.length > 0) return Math.min(...prices);
            }
        }
        return product.price;
    }, [product, hasVariants]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUnavailable) return;
        if (hasVariants) {
            onClick?.(product);
            return;
        }
        onAddToCart({
            ...product,
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1,
        } as any);
    };

    return (
        <div
            onClick={() => onClick?.(product)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group transition-all duration-300 hover:shadow-md flex-shrink-0 w-[160px] sm:w-[180px]"
        >
            {/* Image */}
            <div className="relative aspect-square bg-slate-50 overflow-hidden">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                        sizes="180px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}

                {/* Add Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={isUnavailable}
                    className={`absolute bottom-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isUnavailable
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'text-white hover:brightness-95 active:scale-90'
                        }`}
                    style={!isUnavailable ? { backgroundColor: 'var(--theme-primary)' } : undefined}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>

                {/* Discount Badge */}
                {product.discount_price && product.discount_price < product.price && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        %{Math.round((1 - product.discount_price / product.price) * 100)}
                    </div>
                )}

                {/* Unavailable Badge */}
                {isUnavailable && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full">غير متوفر</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3 text-right">
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight mb-1.5">{product.name}</h3>
                <div className="flex items-center justify-end gap-1.5">
                    {product.discount_price && product.discount_price < product.price ? (
                        <>
                            <span className="text-[11px] text-slate-400 line-through">{product.price.toLocaleString()}</span>
                            <span className="text-[15px] font-bold" style={{ color: 'var(--theme-primary)' }}>{product.discount_price.toLocaleString()}</span>
                        </>
                    ) : (
                        <span className="text-[15px] font-bold" style={{ color: 'var(--theme-primary)' }}>
                            {hasVariants ? `${displayPrice.toLocaleString()}+` : displayPrice.toLocaleString()}
                        </span>
                    )}
                    <span className="text-[11px] text-slate-400">د.ع</span>
                </div>
            </div>
        </div>
    );
}

interface HomeViewProps {
    products: Product[];
    sections: { id: string; name: string; image_url?: string }[];
    onProductClick?: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedSection: string | null;
    setSelectedSection: (s: string | null) => void;
    storeName: string;
    storeLogo?: string;
    storeDescription?: string;
    storePhone?: string;
    storeEmail?: string;
    storeAddress?: string;
    socialLinks?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
    };
    onMenuOpen: () => void;
    onCartOpen: () => void;
    totalItems: number;
    storefrontConfig?: {
        banner?: { title?: string; subtitle?: string; badge?: string; show?: boolean; images?: string[] };
        about?: { content?: string };
    };
}

export default function HomeView({
    products,
    sections,
    onAddToCart,
    onProductClick,
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    storeName,
    storeLogo,
    storeDescription,
    onMenuOpen,
    onCartOpen,
    totalItems,
    storefrontConfig,
}: HomeViewProps) {

    const sectionsRef = useRef<HTMLDivElement>(null);

    // Group products by section/category
    const productsBySection = useMemo(() => {
        const map: Record<string, Product[]> = {};
        products.forEach(p => {
            const cat = (p.category || 'أخرى').trim();
            if (!map[cat]) map[cat] = [];
            map[cat].push(p);
        });
        return map;
    }, [products]);

    // All products for search mode
    const isSearching = searchQuery.trim().length > 0;

    // Colors for section avatars
    const sectionColors = [
        { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        { bg: 'bg-blue-100', text: 'text-blue-600' },
        { bg: 'bg-purple-100', text: 'text-purple-600' },
        { bg: 'bg-amber-100', text: 'text-amber-600' },
        { bg: 'bg-rose-100', text: 'text-rose-600' },
        { bg: 'bg-cyan-100', text: 'text-cyan-600' },
        { bg: 'bg-indigo-100', text: 'text-indigo-600' },
        { bg: 'bg-teal-100', text: 'text-teal-600' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-24">
            {/* ─── Header Bar ─── */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Menu */}
                    <button onClick={onMenuOpen} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                        <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Store Name + Logo */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-slate-800">{storeName}</h1>
                        {storeLogo ? (
                            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
                                <Image src={storeLogo} alt={storeName} width={36} height={36} className="object-contain rounded-xl" />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--theme-primary)' }}>
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <button onClick={onCartOpen} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                        <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {totalItems > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full animate-in zoom-in" style={{ backgroundColor: 'var(--theme-primary)' }}>
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─── Search Bar ─── */}
            <div className="px-4 pt-3 pb-1">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن منتج، ماركة، أو فئة..."
                        className="w-full h-12 pl-4 pr-12 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all text-right"
                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as any}
                        dir="rtl"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* ─── Hero Banner / Slider ─── */}
            {!isSearching && !selectedSection && (
                <div className="px-4 pt-3 pb-2">
                    {/* Render Image Slider if images exist */}
                    {storefrontConfig?.banner?.images && storefrontConfig.banner.images.length > 0 ? (
                        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] shadow-sm">
                            <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar" dir="ltr">
                                {storefrontConfig.banner.images.map((img: string, idx: number) => (
                                    <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                                        <Image src={img} alt={`Banner ${idx + 1}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                            {/* Slide Indicators */}
                            {storefrontConfig.banner.images.length > 1 && (
                                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5" dir="ltr">
                                    {storefrontConfig.banner.images.map((_: any, idx: number) => (
                                        <span key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Text Banner Fallback (only if there is some text config) */
                        (storefrontConfig?.banner?.title || storefrontConfig?.banner?.subtitle) && (
                            <div className="relative rounded-2xl overflow-hidden p-6 min-h-[160px] shadow-sm" style={{ background: `var(--theme-primary)` }}>
                                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                                {/* Badge */}
                                <span className="relative inline-block bg-black/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 backdrop-blur-[2px]">
                                    {storefrontConfig?.banner?.badge || 'جديد'}
                                </span>
                                {/* Text */}
                                <h2 className="relative text-white text-xl font-bold leading-tight mb-1 text-right">
                                    {storefrontConfig?.banner?.title || `مرحباً بكم في ${storeName}`}
                                </h2>
                                <p className="relative text-white/90 text-sm mb-4 text-right">
                                    {storefrontConfig?.banner?.subtitle || storeDescription || 'تصفح أفضل المنتجات بأسعار مميزة'}
                                </p>
                                <button
                                    onClick={() => sectionsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="relative bg-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors float-right"
                                    style={{ color: 'var(--theme-primary)' }}
                                >
                                    تسوق الآن
                                </button>
                                {/* Decorative circles */}
                                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
                                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ─── Categories Section ─── */}
            {!isSearching && sections.length > 0 && (
                <div ref={sectionsRef} className="py-5">
                    <h2 className="text-lg font-bold text-slate-800 text-center mb-4">الأقسام</h2>
                    <div className="flex justify-center gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
                        {/* All */}
                        <button
                            onClick={() => setSelectedSection(null)}
                            className={`flex flex-col items-center gap-2 min-w-[64px] transition-all ${!selectedSection ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${!selectedSection ? 'ring-2 shadow-sm' : 'bg-slate-100'
                                }`} style={!selectedSection ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', '--tw-ring-color': 'var(--theme-primary)' } as any : {}}>
                                <svg className={`w-6 h-6 ${!selectedSection ? '' : 'text-slate-400'}`} style={!selectedSection ? { color: 'var(--theme-primary)' } : {}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-slate-600">الكل</span>
                        </button>

                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setSelectedSection(selectedSection === section.name ? null : section.name)}
                                className={`flex flex-col items-center gap-2 min-w-[64px] transition-all ${selectedSection === section.name ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedSection === section.name ? 'ring-2 shadow-sm' : 'bg-slate-100'
                                    }`} style={selectedSection === section.name ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', '--tw-ring-color': 'var(--theme-primary)' } as any : {}}>
                                    <svg className={`w-6 h-6 ${selectedSection === section.name ? '' : 'text-slate-400'}`} style={selectedSection === section.name ? { color: 'var(--theme-primary)' } : {}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                    </svg>
                                </div>
                                <span className={`text-xs font-medium line-clamp-1 ${selectedSection === section.name ? 'font-bold' : 'text-slate-600'}`} style={selectedSection === section.name ? { color: 'var(--theme-primary)' } : {}}>{section.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Products By Section ─── */}
            {!isSearching && !selectedSection ? (
                <div className="space-y-6 pb-6">
                    {sections.map(section => {
                        const sectionProducts = productsBySection[section.name];
                        if (!sectionProducts || sectionProducts.length === 0) return null;

                        return (
                            <div key={section.id}>
                                {/* Section Header */}
                                <div className="flex items-center justify-between px-4 mb-3">
                                    <button
                                        onClick={() => setSelectedSection(section.name)}
                                        className="text-sm font-medium hover:underline"
                                        style={{ color: 'var(--theme-primary)' }}
                                    >
                                        عرض الكل
                                    </button>
                                    <h3 className="text-base font-bold text-slate-800">{section.name}</h3>
                                </div>

                                {/* Horizontal Scroll */}
                                <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2" dir="rtl">
                                    {sectionProducts.slice(0, 8).map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={onAddToCart}
                                            onClick={onProductClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Uncategorized products */}
                    {productsBySection['أخرى'] && productsBySection['أخرى'].length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-4 mb-3">
                                <button
                                    onClick={() => setSelectedSection('أخرى')}
                                    className="text-sm font-medium text-[#00D084] hover:underline"
                                >
                                    عرض الكل
                                </button>
                                <h3 className="text-base font-bold text-slate-800">منتجات أخرى</h3>
                            </div>
                            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2" dir="rtl">
                                {productsBySection['أخرى'].slice(0, 8).map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={onAddToCart}
                                        onClick={onProductClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ─── Grid View (searching or section selected) ─── */
                <div className="px-4 pb-6">
                    {selectedSection && (
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setSelectedSection(null)}
                                className="text-sm font-medium hover:underline"
                                style={{ color: 'var(--theme-primary)' }}
                            >
                                ← عودة
                            </button>
                            <h2 className="text-lg font-bold text-slate-800">{selectedSection}</h2>
                        </div>
                    )}
                    {isSearching && (
                        <p className="text-sm text-slate-500 text-right mb-3">
                            {products.length} نتيجة بحث
                        </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir="rtl">
                        {products.map(product => (
                            <div key={product.id} className="w-full">
                                <div
                                    onClick={() => onProductClick?.(product)}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group transition-all duration-300 hover:shadow-md"
                                >
                                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                                        {product.image_url ? (
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                fill
                                                className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 640px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const isUnavailable = product.attributes?.isAvailable === false;
                                                if (isUnavailable) return;
                                                if (product.attributes?.hasVariants) { onProductClick?.(product); return; }
                                                onAddToCart({ ...product, quantity: 1 } as any);
                                            }}
                                            className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-[#00D084] text-white flex items-center justify-center shadow-md hover:bg-[#00B870] active:scale-90 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-3 text-right">
                                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight mb-1.5">{product.name}</h3>
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-[15px] font-bold text-[#00D084]">{product.price.toLocaleString()}</span>
                                            <span className="text-[11px] text-slate-400">د.ع</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {products.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <p className="text-slate-500 font-medium">لا توجد منتجات</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
