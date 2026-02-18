'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

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
        isAvailable?: boolean;
        outOfStockBehavior?: 'hide' | 'show_badge';
    };
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const isOutOfStock = product.attributes?.isAvailable === false;

    return (
        <div className={`group relative flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] transition-all duration-700 overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}>
            <div className="aspect-[4/5] relative overflow-hidden">
                <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1560362614-890275988cd7?w=800'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <span className="px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-[10px] font-black italic shadow-xl shadow-rose-500/20 transform -rotate-12 transition-transform group-hover:rotate-0">
                            نفذ من المخزون
                        </span>
                    </div>
                )}

                {!isOutOfStock && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl flex items-center justify-center text-indigo-600 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-600 hover:text-white active:scale-95"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="p-6 text-right space-y-2 flex-1 flex flex-col justify-between">
                <div>
                    <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 italic tracking-tight uppercase leading-tight">
                        {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1 italic tracking-widest">{product.category}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <span className="text-xl font-black text-indigo-600 italic tracking-tighter">
                        {product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase italic">ر.س</span>
                </div>
            </div>
        </div>
    );
};

interface HomeViewProps {
    products: Product[];
    allProducts: Product[];
    sections: { id: string, name: string, image_url?: string }[];
    onProductClick: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedSection: string | null;
    setSelectedSection: (cat: string | null) => void;
    storeName: string;
}

export default function HomeView({
    products,
    allProducts,
    sections,
    onProductClick,
    onAddToCart,
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    storeName
}: HomeViewProps) {

    const visibleProducts = useMemo(() => {
        return products;
    }, [products]);

    const getSectionIcon = (cat: string) => {
        const icons: Record<string, string> = {
            'Food': '🍔',
            'Electronics': '💻',
            'Fashion': '👕',
            'Home': '🏠',
            'Drinks': '🍹',
            'Sweets': '🍰',
            'Other': '📦'
        };
        if (cat.includes('أكل') || cat.includes('طعام')) return '🍔';
        if (cat.includes('إلكترونيات')) return '💻';
        if (cat.includes('ملابس') || cat.includes('أزياء')) return '👕';
        if (cat.includes('منزل') || cat.includes('ديكور')) return '🏠';
        if (cat.includes('مشروبات') || cat.includes('عصير')) return '🍹';
        if (cat.includes('حلويات')) return '🍰';

        return icons[cat] || '✨';
    };

    return (
        <main className="px-6 pt-6 space-y-12 pb-32 bg-[#FAFBFF]" dir="rtl">
            {/* Search Header - Premium */}
            <div className="relative group max-w-2xl mx-auto">
                <input
                    type="text"
                    placeholder="ابحث عن أحدث التصاميم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-7 px-16 text-sm focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-right font-black italic shadow-[0_15px_60px_rgba(0,0,0,0.04)] outline-none"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-50 rounded-2xl group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-500 shadow-sm">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Category Navigation */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">تصفح المجموعات</h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-slate-100 to-transparent mx-6" />
                </div>

                <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-none snap-x px-4">
                    <button
                        onClick={() => setSelectedSection(null)}
                        className={`flex-shrink-0 group transition-all duration-500 ${!selectedSection ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
                    >
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-sm transition-all duration-500 ${!selectedSection ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'}`}>
                            🏠
                        </div>
                        <p className={`text-[11px] font-black mt-3 text-center transition-colors ${!selectedSection ? 'text-indigo-600' : 'text-slate-400'}`}>الرئيسية</p>
                    </button>

                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setSelectedSection(section.name)}
                            className={`flex-shrink-0 group transition-all duration-500 ${selectedSection === section.name ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-sm transition-all duration-500 overflow-hidden ${selectedSection === section.name ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'}`}>
                                {section.image_url ? (
                                    <img src={section.image_url} className="w-full h-full object-cover" alt={section.name} />
                                ) : (
                                    getSectionIcon(section.name)
                                )}
                            </div>
                            <p className={`text-[11px] font-black mt-3 text-center transition-colors ${selectedSection === section.name ? 'text-indigo-600' : 'text-slate-400'}`}>{section.name}</p>
                        </button>
                    ))}
                </div>
            </section>

            {!selectedSection ? (
                <>
                    {/* Hero Showcase */}
                    <section className="px-4">
                        <div className="relative h-[450px] rounded-[3.5rem] overflow-hidden bg-slate-900 group shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600"
                                className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2000ms]"
                                alt="Banner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-16 right-16 left-16 text-right space-y-6 max-w-2xl mr-auto ml-0">
                                <div className="inline-block px-4 py-2 bg-indigo-600/20 backdrop-blur-md rounded-xl border border-indigo-400/20">
                                    <span className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em]">نسخة حصرية منتصف العام</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-[1.1] drop-shadow-2xl">
                                    عصر جديد من <br /> الأناقة في {storeName}
                                </h1>
                                <p className="text-slate-300 text-lg font-bold italic max-w-md mr-auto">
                                    مجموعتنا الجديدة صممت خصيصاً لتعيد تعريف مفهوم الرقي في يومك.
                                </p>
                                <div className="pt-4">
                                    <button className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black italic tracking-tight shadow-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95">استكشف المجموعة الآن</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Latest & Featured */}
                    {[
                        { title: 'وصل حديثاً', sub: 'استلهم ستايلك من جديد', items: visibleProducts.slice(0, 4) },
                        { title: 'مختاراتنا لك', sub: 'الأكثر طلباً هذا الشهر', items: visibleProducts.slice(4, 8) }
                    ].map((row, idx) => (
                        <section key={idx} className="px-4">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic">{row.sub}</h2>
                                    <h3 className="text-3xl font-black text-slate-800 italic tracking-tight leading-none">{row.title}</h3>
                                </div>
                                <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {row.items.map(product => (
                                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                                ))}
                            </div>
                        </section>
                    ))}
                </>
            ) : (
                /* Premium Section Detail View */
                <section className="px-4 space-y-12">
                    <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 h-[450px] shadow-2xl group animate-in fade-in zoom-in-95 duration-1000">
                        {/* Dynamic Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 blur-3xl bg-indigo-600 rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-between px-16 z-10">
                            <div className="space-y-8 text-right">
                                <div className="space-y-3">
                                    <span className="px-5 py-2 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-[0.4em] inline-block rounded-lg shadow-lg shadow-indigo-600/20 italic">قسم متميز</span>
                                    <h2 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">
                                        {selectedSection}
                                    </h2>
                                </div>
                                <p className="text-slate-400 font-bold italic text-lg max-w-xl leading-relaxed">
                                    مجموعة مختارة بعناية فائقة تلبي تطلعاتك وتمنحك التميز الذي تستحقه في عالم {selectedSection}.
                                </p>
                                <div className="pt-2">
                                    <button
                                        onClick={() => setSelectedSection(null)}
                                        className="px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-xl text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:border-rose-500 transition-all active:scale-95"
                                    >
                                        العودة للرئيسية ×
                                    </button>
                                </div>
                            </div>

                            <div className="relative mt-8 md:mt-0">
                                <div className="w-56 h-56 bg-white/5 backdrop-blur-[40px] rounded-[4rem] flex items-center justify-center text-[100px] shadow-[0_20px_100px_rgba(0,0,0,0.3)] border border-white/10 transform rotate-12 group-hover:rotate-0 transition-all duration-1000 relative z-20">
                                    {getSectionIcon(selectedSection)}
                                </div>
                                <div className="absolute inset-0 bg-indigo-600 blur-[80px] opacity-20 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        {visibleProducts.length > 0 ? (
                            visibleProducts.map(product => (
                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center space-y-8 animate-in fade-in slide-in-from-bottom-10">
                                <div className="w-32 h-32 bg-white rounded-[3rem] shadow-xl flex items-center justify-center mx-auto border border-slate-50 rotate-12">
                                    <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">مخزون فارغ</p>
                                    <p className="text-xl font-black text-slate-400 italic mt-2">لا توجد منتجات في هذا القسم حالياً.</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSection(null)}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black italic shadow-lg shadow-indigo-600/20 hover:bg-slate-950 transition-all"
                                >
                                    تصفح أقسام أخرى
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Premium Promotions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {[
                    { title: 'مجموعة الصيف', sub: 'تخفيضات تصل إلى 30%', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1399', color: 'bg-rose-500' },
                    { title: 'الأكثر مبيعاً', sub: 'تصفح تشكيلة الأحذية المميزة', img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1480', color: 'bg-indigo-600' }
                ].map((promo, idx) => (
                    <div key={idx} className="relative h-64 rounded-[3rem] overflow-hidden group shadow-xl">
                        <img src={promo.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" />
                        <div className="absolute inset-0 bg-slate-900/40 p-12 flex flex-col justify-center text-right">
                            <h4 className="text-3xl font-black text-white mb-2 leading-tight italic tracking-tighter">{promo.title}</h4>
                            <p className="text-sm font-bold text-slate-200 italic">{promo.sub}</p>
                            <div className="mt-6">
                                <button className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">اكتشف الآن</button>
                            </div>
                        </div>
                        <div className={`absolute top-6 left-6 ${promo.color} text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg transform -rotate-12`}>خصم خاص</div>
                    </div>
                ))}
            </section>
        </main>
    );
}
