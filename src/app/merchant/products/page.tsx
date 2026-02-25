'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import AddProductModal from './AddProductModal';
import SectionsModal from './SectionsModal';
import { getSections } from '../sections/actions';

interface Section {
    id: string;
    name: string;
}

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

interface ProductAttributes {
    hasVariants: boolean;
    variantOptions: VariantOption[];
    variantCombinations: VariantCombination[];
    isAvailable: boolean;
    isHidden?: boolean;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    section_id: string;
    price: number;
    stock_quantity: number;
    image_url: string;
    created_at: string;
    sku?: string;
    status: 'active' | 'low_stock' | 'inactive';
    attributes?: ProductAttributes;
}

export default function MerchantProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
    const [storeId, setStoreId] = useState<string>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [storeSubscription, setStoreSubscription] = useState<any>(null);

    const router = useRouter();

    const { data: pageData, isLoading: loading, refetch: fetchProducts } = useQuery({
        queryKey: ['merchant-products'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: storeData } = await supabase
                .from('stores')
                .select(`
                    id,
                    subscription_plans (
                        id, max_products, max_categories, custom_theme, remove_branding, advanced_reports
                    )
                `)
                .eq('merchant_id', user.id)
                .single();

            if (!storeData) throw new Error('Store not found');

            const [sectionsData, { data: productsData, error: productsError }] = await Promise.all([
                getSections(storeData.id),
                supabase
                    .from('products')
                    .select('id, name, description, section_id, price, image_url, created_at, attributes, stock_quantity')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false })
                    .limit(20)
            ]);

            if (productsError) throw productsError;

            const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
                ...p,
                sku: `SKU-${Math.floor(Math.random() * 9000) + 1000}`,
                status: (p.stock_quantity === 0 ? 'inactive' : p.stock_quantity < 10 ? 'low_stock' : 'active') as 'active' | 'low_stock' | 'inactive'
            }));

            const calculatedStats = {
                total: mappedProducts.length,
                active: mappedProducts.filter(p => p.attributes?.isAvailable !== false).length,
                inactive: mappedProducts.filter(p => p.attributes?.isAvailable === false).length
            };

            return {
                storeId: storeData.id,
                subscription: storeData.subscription_plans,
                sections: sectionsData,
                products: mappedProducts,
                stats: calculatedStats
            };
        }
    });

    useEffect(() => {
        if (pageData) {
            setStoreId(pageData.storeId);
            setStoreSubscription(pageData.subscription);
            setSections(pageData.sections);
            setProducts(pageData.products);
            setStats(pageData.stats);
        }
    }, [pageData]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert('حدث خطأ أثناء الحذف');
        } else {
            fetchProducts();
        }
    };

    const toggleAvailability = async (product: Product) => {
        const newAvailability = !(product.attributes?.isAvailable ?? true);
        // Optimistic local update
        setProducts(prev => prev.map(p => p.id === product.id
            ? { ...p, attributes: { ...p.attributes, isAvailable: newAvailability } as ProductAttributes }
            : p
        ));
        const { error } = await supabase
            .from('products')
            .update({ attributes: { ...product.attributes, isAvailable: newAvailability } })
            .eq('id', product.id);
        if (error) fetchProducts(); // Revert on error
    };

    const toggleVisibility = async (product: Product) => {
        const newHidden = !(product.attributes?.isHidden ?? false);
        // Optimistic local update
        setProducts(prev => prev.map(p => p.id === product.id
            ? { ...p, attributes: { ...p.attributes, isHidden: newHidden } as ProductAttributes }
            : p
        ));
        const { error } = await supabase
            .from('products')
            .update({ attributes: { ...product.attributes, isHidden: newHidden } })
            .eq('id', product.id);
        if (error) fetchProducts(); // Revert on error
    };

    const StatusBadge = ({ status }: { status: Product['status'] }) => {
        const styles: Record<Product['status'], string> = {
            active: 'bg-emerald-50 text-emerald-600',
            low_stock: 'bg-amber-50 text-amber-600',
            inactive: 'bg-rose-50 text-rose-600'
        };
        const labels: Record<Product['status'], string> = {
            active: 'نشط',
            low_stock: 'منخفض',
            inactive: 'غير نشط'
        };
        return (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="px-4 lg:px-10 pb-10 space-y-8 lg:space-y-10 pt-6 lg:pt-0 animate-pulse" dir="rtl">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                    <div className="space-y-3">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="h-12 w-32 lg:w-40 bg-slate-200 rounded-2xl"></div>
                </div>

                {/* Categories Skeleton */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-10 rounded-xl flex-shrink-0 ${i === 1 ? 'w-24 bg-slate-200' : 'w-20 bg-slate-100'}`}></div>
                    ))}
                </div>

                {/* Products Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-4 space-y-4">
                            <div className="w-full aspect-square bg-slate-100 rounded-2xl"></div>
                            <div className="space-y-3 px-2">
                                <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
                                <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
                            </div>
                            <div className="h-10 w-full bg-slate-50 rounded-xl mt-4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.section_id === selectedCategory);

    return (
        <div className="px-4 lg:px-10 pb-10 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tighter">إدارة المنتجات والأقسام</h1>
                    <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest">عرض وتعديل كافة المنتجات والأقسام في متجرك.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                    <button
                        onClick={() => {
                            if (storeSubscription && storeSubscription.max_categories !== -1 && sections.length >= storeSubscription.max_categories) {
                                alert(`لقد وصلت للحد الأقصى للأقسام (${storeSubscription.max_categories}). يرجى الترقية لإضافة المزيد.`);
                                return;
                            }
                            setIsSectionsModalOpen(true);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-8 py-3 lg:py-4 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 rounded-2xl font-black text-sm shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        إضافة قسم جديد
                    </button>
                    <button
                        onClick={() => {
                            if (storeSubscription && storeSubscription.max_products !== -1 && products.length >= storeSubscription.max_products) {
                                alert(`لقد وصلت للحد الأقصى لعدد المنتجات (${storeSubscription.max_products}). يرجى التواصل مع الإدارة للترقية.`);
                                return;
                            }
                            setEditingProduct(null);
                            setIsModalOpen(true);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-8 py-3 lg:py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        إضافة منتج
                    </button>
                </div>
            </div>

            {/* Product Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8">
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">إجمالي المنتجات</h3>
                        <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-50 text-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">المنتجات النشطة</h3>
                        <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.active.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-emerald-50 text-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm flex items-center justify-between col-span-2 lg:col-span-2">
                    <div>
                        <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">غير متوفرة / مخفية</h3>
                        <p className="text-2xl lg:text-3xl font-bold text-slate-800 leading-none">{stats.inactive.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-rose-50 text-rose-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white border border-slate-100 text-slate-500'
                        }`}
                >
                    الكل ({products.length})
                </button>
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setSelectedCategory(section.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === section.id
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white border border-slate-100 text-slate-500'
                            }`}
                    >
                        {section.name} ({products.filter(p => p.section_id === section.id).length})
                    </button>
                ))}
            </div>

            {/* Mobile Card Grid */}
            <div className="md:hidden">
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h4 className="font-black text-slate-700">لا توجد منتجات</h4>
                        <p className="text-xs text-slate-400">ابدأ بإضافة منتجك الأول</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map(product => {
                            const isAvailable = product.attributes?.isAvailable !== false;
                            const isHidden = product.attributes?.isHidden === true;
                            return (
                                <div key={product.id} className={`bg-white rounded-3xl border overflow-hidden ${isAvailable ? 'border-slate-100' : 'border-amber-100'
                                    }`}>
                                    <div className="relative aspect-square bg-slate-50">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                            {!isAvailable && <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">نفذ</span>}
                                            {isHidden && <span className="bg-slate-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">مخفي</span>}
                                        </div>
                                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="absolute bottom-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-black text-slate-800 text-sm leading-tight line-clamp-2">{product.name}</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-base font-black text-indigo-600">{product.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">د.ع</span>
                                        </div>
                                        {product.section_id && <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-50 rounded-full text-[10px] font-bold text-slateate-500">{sections.find(s => s.id === product.section_id)?.name || 'غير مصنف'}</span>}
                                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                                            <button onClick={() => toggleAvailability(product)} className={`flex-1 h-8 rounded-xl text-[10px] font-bold transition-all ${isAvailable ? 'bg-slate-50 text-slate-400' : 'bg-amber-50 text-amber-600'
                                                }`}>{isAvailable ? 'متوفر ✓' : 'نفذ'}</button>
                                            <button onClick={() => toggleVisibility(product)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isHidden ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {isHidden ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.046m4.51-4.51A9.959 9.959 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(product.id, product.name)} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Desktop Table Wrapper */}
            <div className="hidden md:block bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">المنتج</th>
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">القسم</th>
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">السعر</th>
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                                <th className="px-6 lg:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                <tr key={product.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-6 lg:px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-50 rounded-xl lg:rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-100 transition-all">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm lg:text-base">{product.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 lg:px-8 py-6 text-center">
                                        <span className="px-3 lg:px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500">
                                            {sections.find(s => s.id === product.section_id)?.name || 'غير مصنف'}
                                        </span>
                                    </td>
                                    <td className="px-6 lg:px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-base lg:text-lg font-black text-slate-800">{product.price.toLocaleString()}</span>
                                            <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase">د.ع</span>
                                        </div>
                                    </td>
                                    <td className="px-6 lg:px-8 py-6 text-center">
                                        <StatusBadge status={product.status} />
                                    </td>
                                    <td className="px-6 lg:px-8 py-6 text-center">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {new Date(product.created_at).toLocaleDateString('ar-SA')}
                                        </span>
                                    </td>
                                    <td className="px-6 lg:px-8 py-6">
                                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                                            <button
                                                onClick={() => toggleAvailability(product)}
                                                title={product.attributes?.isAvailable === false ? 'تغيير كمتوفر' : 'تعيين كنفذ من المخزون'}
                                                className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all ${product.attributes?.isAvailable === false ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {product.attributes?.isAvailable === false ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeDasharray="4 4" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    )}
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => toggleVisibility(product)}
                                                title={product.attributes?.isHidden ? 'مخفي حالياً (اضغط للإظهار)' : 'ظاهر حالياً (اضغط للإخفاء)'}
                                                className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all ${!product.attributes?.isHidden ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {product.attributes?.isHidden ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.046m4.51-4.51A9.959 9.959 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </>
                                                    )}
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.name)}
                                                className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 lg:px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center text-slate-200">
                                                <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800">لا توجد منتجات بعد</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ابدأ بإضافة منتجاتك الأولى الآن.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Floating Add Button (mobile only) */}
            <button
                onClick={() => {
                    if (storeSubscription && storeSubscription.max_products !== -1 && products.length >= storeSubscription.max_products) {
                        alert(`لقد وصلت للحد الأقصى لعدد المنتجات (${storeSubscription.max_products}).`);
                        return;
                    }
                    setEditingProduct(null);
                    setIsModalOpen(true);
                }}
                className="md:hidden fixed bottom-24 left-4 z-40 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            <footer className="text-center pt-10 pb-5">
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">© 2024 نظام إدارة التاجر. جميع الحقوق محفوظة لشركة النخبة للتجارة.</p>
            </footer>

            {storeId && (
                <AddProductModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                    }}
                    onSuccess={() => fetchProducts()}
                    storeId={storeId}
                    sections={sections}
                    initialData={editingProduct}
                    storeSubscription={storeSubscription}
                />
            )}

            {storeId && (
                <SectionsModal
                    isOpen={isSectionsModalOpen}
                    onClose={() => setIsSectionsModalOpen(false)}
                    storeId={storeId}
                    onSuccess={() => fetchProducts()}
                />
            )}
        </div>
    );
}
