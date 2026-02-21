import React, { useMemo } from 'react';
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
        outOfStockBehavior?: 'hide' | 'show_badge';
        variantCombinations?: { price: string }[];
    };
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
    const isOutOfStock = product.attributes?.isAvailable === false;
    const [imgSrc, setImgSrc] = React.useState(product.image_url || '/placeholder-product.png');
    const [isAdded, setIsAdded] = React.useState(false);

    React.useEffect(() => {
        setImgSrc(product.image_url || '/placeholder-product.png');
    }, [product.image_url]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If the product has variants, open the details modal instead
        if (product.attributes?.hasVariants) {
            onClick?.(product);
            return;
        }

        onAddToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div
            onClick={() => onClick?.(product)}
            className={`group relative flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] transition-all duration-700 overflow-hidden cursor-pointer ${isOutOfStock ? 'opacity-60' : ''}`}
        >
            <div className="aspect-[4/5] relative overflow-hidden">
                <Image
                    src={imgSrc}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    onError={() => setImgSrc('/placeholder-product.png')}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <span className="px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-[10px] font-black shadow-xl shadow-rose-500/20 transform -rotate-12 transition-transform group-hover:rotate-0">
                            نفذ من المخزون
                        </span>
                    </div>
                )}

                {!isOutOfStock && (
                    <button
                        onClick={handleAddToCart}
                        className={`absolute bottom-6 right-6 w-14 h-14 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl flex items-center justify-center transition-all duration-500 active:scale-95 z-20 ${isAdded ? 'bg-emerald-500 text-white scale-110 opacity-100 translate-y-0' : 'text-indigo-600 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-indigo-600 hover:text-white'
                            }`}
                    >
                        {isAdded ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            <div className="p-6 text-right space-y-2 flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 tracking-tight uppercase leading-tight">
                        {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1 tracking-widest">{product.category}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    {(() => {
                        const combos = product.attributes?.variantCombinations || [];
                        const validPrices = combos
                            .map(c => parseFloat(c.price || '0'))
                            .filter(p => p > 0);

                        // If we have variants with prices, find the minimum, else use base price
                        const displayPrice = validPrices.length > 0 ? Math.min(...validPrices) : product.price;

                        return (
                            <>
                                <span className="text-xl font-black text-indigo-600 tracking-tighter">
                                    {displayPrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">د.ع</span>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

interface HomeViewProps {
    products: Product[];
    sections: { id: string, name: string, image_url?: string }[];
    onProductClick?: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedSection: string | null;
    setSelectedSection: (cat: string | null) => void;
    storeName: string;
    storeLogo?: string;
    socialLinks?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
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
    storeName,
    storeLogo,
    socialLinks
}: HomeViewProps) {

    // Group products by section
    const groupedProducts = useMemo(() => {
        const groups: Record<string, Product[]> = {};

        // Initialize groups for all sections to maintain order
        sections.forEach(s => {
            groups[s.name] = [];
        });

        // Add "Other" group for products without a clear section
        groups['أخرى'] = [];

        products.forEach(p => {
            const sectionName = p.category || 'أخرى';
            if (groups[sectionName]) {
                groups[sectionName].push(p);
            } else {
                groups['أخرى'].push(p);
            }
        });

        // Remove empty groups (optional, but keep sections for navigation)
        return groups;
    }, [products, sections]);

    const scrollToSection = (sectionName: string) => {
        const element = document.getElementById(`section-${sectionName}`);
        if (element) {
            const offset = 120; // sticky header offset
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <main className="min-h-screen bg-[#F8F9FB] pb-32 font-sans" dir="rtl">
            {/* Branded Header */}
            <header className="px-6 py-10 lg:py-16 lg:max-w-7xl lg:mx-auto lg:px-12 xl:px-24 flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-slate-200/50 flex items-center justify-center overflow-hidden border-4 border-white transition-transform duration-700 group-hover:scale-110">
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-4xl lg:text-5xl font-black text-indigo-600 uppercase">
                                {storeName.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase">{storeName}</h1>
                    <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full" />
                </div>
            </header>

            {/* Minimal Sticky Section Nav */}
            <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-4 lg:py-6 shadow-sm overflow-hidden lg:px-12 xl:px-24">
                <div className="flex items-center gap-4 lg:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x lg:justify-center lg:flex-wrap pb-2 lg:pb-0">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex-shrink-0 px-6 py-2.5 lg:px-8 lg:py-3 bg-slate-900 text-white rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
                    >
                        الكل
                    </button>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.name)}
                            className="flex-shrink-0 px-6 py-2.5 lg:px-8 lg:py-3 bg-white text-slate-500 border border-slate-200 rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all hover:border-indigo-600 hover:text-indigo-600 active:scale-95 hover:shadow-md"
                        >
                            {section.name}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="px-6 space-y-24 mt-12 lg:max-w-7xl lg:mx-auto lg:px-12 xl:px-24">
                {sections.map((section) => (
                    <section key={section.id} id={`section-${section.name}`} className="scroll-mt-32 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[10px] lg:text-xs font-black text-indigo-600 uppercase tracking-[0.5em] leading-none">تصفح المجموعة</h3>
                                <h2 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase">{section.name}</h2>
                            </div>
                            <div className="h-[2px] flex-1 bg-gradient-to-l from-slate-100 to-transparent mx-6 lg:mx-10" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-8">
                            {groupedProducts[section.name]?.length > 0 ? (
                                groupedProducts[section.name].map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={onAddToCart}
                                        onClick={onProductClick}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-16 bg-white/50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
                                    <p className="text-slate-400 text-[10px] lg:text-xs font-black uppercase tracking-widest">لا توجد منتجات حالياً في هذا القسم</p>
                                </div>
                            )}
                        </div>
                    </section>
                ))}

                {/* Handle products in "Other" category or uncategorized */}
                {groupedProducts['أخرى']?.length > 0 && (
                    <section id="section-أخرى" className="scroll-mt-32 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[10px] lg:text-xs font-black text-indigo-600 uppercase tracking-[0.5em] leading-none px-2 lg:px-4 hidden lg:block">منتجات متنوعة</h3>
                                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-slate-100">
                                    <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tighter leading-none">أخرى</h2>
                                    <span className="text-xs font-bold text-slate-400">({groupedProducts['أخرى'].length} منتجات)</span>
                                </div>
                            </div>
                            <div className="h-[2px] flex-1 bg-gradient-to-l from-slate-100 to-transparent lg:mx-10" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-8 opacity-90">
                            {groupedProducts['أخرى'].map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    onClick={onProductClick}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Branded Footer */}
            <footer className="mt-40 px-6 py-20 bg-white border-t border-slate-100 lg:px-12 xl:px-24 flex flex-col items-center space-y-12">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden grayscale opacity-50">
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-2xl font-black text-slate-400 uppercase">{storeName.charAt(0)}</span>
                        )}
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{storeName}</p>
                </div>

                {socialLinks && (
                    <div className="flex items-center justify-center gap-6 lg:gap-8">
                        {socialLinks.whatsapp && (
                            <a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all hover:scale-110 shadow-lg shadow-emerald-500/10">
                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997 0-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.143c1.559.925 3.328 1.413 5.127 1.414 5.564 0 10.091-4.527 10.093-10.091 0-2.693-1.05-5.228-2.955-7.134-1.905-1.906-4.44-2.956-7.134-2.957-5.564 0-10.09 4.526-10.093 10.091 0 1.782.47 3.522 1.36 5.068l-.893 3.255 3.492-.916zm11.503-7.534c.007.133.003.265-.046.39-.156.46-.74.654-1.211.772-.491.125-1.12.094-1.883-.244-.759-.335-1.891-.825-3.372-2.482-1.282-1.438-2.147-3.218-2.398-3.535-.25-.317-.438-.687-.438-1.054 0-.367.187-.706.375-.971.188-.265.407-.315.531-.315.125 0 .25.015.344.015.118.013.232.012.33.082.125.088.438 1.054.469 1.12.031.066.031.132.062.197.051.106.012.213-.038.319l-.375.462c-.046.05-.1.115-.042.215.3.521.664 1.045 1.11 1.543a8.66 8.66 0 001.625 1.48c.11.085.18.103.255.038.075-.065.312-.36.397-.48.084-.121.171-.102.261-.067.09.035.569.269.667.317.098.048.164.072.2.087.034.01.077.01.12.03.111.052.175.25.175.406z" />
                                </svg>
                            </a>
                        )}
                        {socialLinks.instagram && (
                            <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all hover:scale-110 shadow-lg shadow-pink-500/10">
                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        )}
                        {socialLinks.tiktok && (
                            <a href={`https://tiktok.com/@${socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110 shadow-lg shadow-slate-900/10">
                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.6 8.6 0 01-1.87-1.41v8.74c0 1.39-.3 2.8-.91 4.05a7.8 7.8 0 01-2.49 3.01c-1.25.86-2.73 1.36-4.24 1.47-1.52.11-3.08-.1-4.49-.69a7.8 7.8 0 01-3.23-2.58A7.8 7.8 0 010 13.9c.01-1.39.29-2.8.91-4.05a7.8 7.8 0 012.49-3.01c1.25-.86 2.73-1.36 4.24-1.47 1.52-.11 3.08.1 4.49.69.21.09.41.19.61.3V1.52c-.01-.5-.01-1 0-1.5z" />
                                </svg>
                            </a>
                        )}
                        {socialLinks.facebook && (
                            <a href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all hover:scale-110 shadow-lg shadow-blue-600/10">
                                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                        )}
                    </div>
                )}

                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">صمم بواسطة SaaSPlus &copy; {new Date().getFullYear()}</p>
            </footer>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
}
