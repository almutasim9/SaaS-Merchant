import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import POSSkeleton from './POSSkeleton';

interface ProductGridProps {
    products: Product[];
    currency: string;
    isLoading: boolean;
    activeSection: string;
    sections: any[];
    searchQuery: string;
    onSectionChange: (id: string) => void;
    onSearchChange: (query: string) => void;
    onAddToCart: (product: Product) => void;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
    onShowHistory: () => void;
    lastScannedCode: string | null;
    merchantName: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    showScannerStatus?: boolean;
    showHistory?: boolean;
}

export const ProductGrid = ({
    products,
    currency,
    isLoading,
    activeSection,
    sections,
    searchQuery,
    onSectionChange,
    onSearchChange,
    onAddToCart,
    isFullScreen,
    onToggleFullScreen,
    onShowHistory,
    lastScannedCode,
    merchantName,
    searchInputRef,
    showScannerStatus = true,
    showHistory = true
}: ProductGridProps) => {
    if (isLoading) return <POSSkeleton />;

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* POS Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6 sticky top-0 z-20">
                <button 
                    onClick={onToggleFullScreen}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isFullScreen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-black hover:bg-slate-200'}`}
                    title={isFullScreen ? "الخروج من ملء الشاشة" : "وضع ملء الشاشة"}
                >
                    {isFullScreen ? '↙️' : '↗️'}
                </button>

                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative flex-1">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black">🔍</span>
                        <input 
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="ابحث بالاسم أو امسح الباركود..."
                            className="w-full h-12 bg-slate-100 border-none rounded-2xl pr-12 pl-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {showHistory && (
                        <button 
                            onClick={onShowHistory}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">📜</span>
                            <span className="text-[10px] font-black text-black uppercase tracking-widest">تاريخ العمليات</span>
                        </button>
                    )}
 
                    {showScannerStatus && (
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <div className={`w-2 h-2 rounded-full animate-pulse bg-emerald-500`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-black">حالة القارئ</span>
                                <span className="text-[8px] text-black font-bold uppercase tracking-widest leading-none">
                                    {lastScannedCode ? `اخر مسح: ${lastScannedCode}` : 'جاهز للمسح'}
                                </span>
                            </div>
                            <span className="text-lg opacity-40">🔖</span>
                        </div>
                    )}
                    <div className="text-left hidden lg:block">
                        <h1 className="text-lg font-black text-black">نظام الكاشير v1</h1>
                        <p className="text-[10px] text-black font-bold uppercase tracking-widest text-right">المحيط: مزامن</p>
                    </div>
                </div>
            </div>

            {/* Section Quick Filters */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50/50 backdrop-blur-sm sticky top-20 z-10">
                <button 
                    onClick={() => onSectionChange('all')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeSection === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-black border border-slate-200 hover:border-slate-400'}`}
                >
                    الكل
                </button>
                {sections.map((section: any) => (
                    <button 
                        key={section.id}
                        onClick={() => onSectionChange(section.id)}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeSection === section.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-black border border-slate-200 hover:border-slate-400'}`}
                    >
                        {section.name}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {products.map((product) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={product.id}
                                onClick={() => onAddToCart(product)}
                                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group"
                            >
                                <div className="aspect-square bg-slate-50 relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-900">🖼️</div>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                                    {product.stock_quantity <= 5 && (
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-lg">نفد قريباً</div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                                    <h3 className="text-xs font-black text-black line-clamp-2">{product.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-black">{product.price} <span className="text-[10px]">{currency}</span></span>
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-black group-hover:bg-indigo-600 group-hover:text-white transition-all">+</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
