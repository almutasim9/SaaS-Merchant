'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AddProductModal from './AddProductModal';
import { getSections } from '../sections/actions';

interface Section {
    id: string;
    name: string;
}

interface ProductAttributes {
    hasVariants: boolean;
    options: {
        sizes: string[];
        colors: string[];
        weights: { value: string; unit: string }[];
    };
    weightPrices: Record<string, string>;
    isAvailable: boolean;
    outOfStockBehavior: 'hide' | 'show_badge';
    isHidden?: boolean;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    category: string;
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
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storeId, setStoreId] = useState<string>('');
    const [sections, setSections] = useState<Section[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0
    });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch store ID first
        const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', user.id)
            .single();

        if (storeData) {
            setStoreId(storeData.id);

            // Parallel fetching of sections and products
            const [sectionsData, { data: productsData, error: productsError }] = await Promise.all([
                getSections(storeData.id),
                supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeData.id)
                    .order('created_at', { ascending: false })
            ]);

            setSections(sectionsData);

            if (!productsError) {
                // Mapping status for UI demonstration
                const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
                    ...p,
                    sku: `SKU-${Math.floor(Math.random() * 9000) + 1000}`,
                    status: (p.stock_quantity === 0 ? 'inactive' : p.stock_quantity < 10 ? 'low_stock' : 'active') as 'active' | 'low_stock' | 'inactive'
                }));
                setProducts(mappedProducts);

                // Real-world stats would be calculated here
                setStats({
                    total: mappedProducts.length,
                    active: mappedProducts.filter(p => p.attributes?.isAvailable !== false).length,
                    inactive: mappedProducts.filter(p => p.attributes?.isAvailable === false).length
                });
            }
        }
        setLoading(false);
    };

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
        const { error } = await supabase
            .from('products')
            .update({
                attributes: {
                    ...product.attributes,
                    isAvailable: newAvailability
                }
            })
            .eq('id', product.id);

        if (!error) fetchProducts();
    };

    const toggleVisibility = async (product: Product) => {
        const newHidden = !(product.attributes?.isHidden ?? false);
        const { error } = await supabase
            .from('products')
            .update({
                attributes: {
                    ...product.attributes,
                    isHidden: newHidden
                }
            })
            .eq('id', product.id);

        if (!error) fetchProducts();
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
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-10 pb-10 space-y-10" dir="rtl">
            {/* Header Content */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 italic tracking-tighter">إدارة المنتجات والأقسام</h1>
                    <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-widest italic">عرض وتعديل كافة المنتجات والأقسام في متجرك.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/merchant/sections"
                        className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-sm italic shadow-sm hover:border-indigo-600 hover:text-indigo-600 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        إدارة الأقسام
                    </Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm italic shadow-xl shadow-indigo-600/20 hover:bg-slate-900 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        إضافة منتج جديد
                    </button>
                </div>
            </div>

            {/* Product Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">إجمالي المنتجات</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">المنتجات النشطة</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.active.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">غير متوفرة / مخفية</h3>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.inactive.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Filters and Table Wrapper */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden whitespace-nowrap">
                {/* Custom Filters Bar */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-400">
                            {products.length > 0 ? `عرض 1-${products.length} من أصل ${stats.total}` : 'لا توجد بيانات لعرضها'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl">
                            <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all uppercase italic">كافة الأقسام</button>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs shadow-sm hover:shadow-md transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            تصفية متقدمة
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">المنتج</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">القسم</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">السعر</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">الحالة</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">تاريخ الإضافة</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.length > 0 ? products.map((product) => (
                                <tr key={product.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-100 transition-all">
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
                                                <h4 className="font-black text-slate-800 italic">{product.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 italic">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-black text-slate-800 italic">{product.price.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase italic">ر.س</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <StatusBadge status={product.status} />
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 italic">
                                            {new Date(product.created_at).toLocaleDateString('ar-SA')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => toggleVisibility(product)}
                                                title={product.attributes?.isHidden ? "إظهار المنتج" : "إخفاء المنتج"}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${product.attributes?.isHidden ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {product.attributes?.isHidden ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.046m4.51-4.51A9.959 9.959 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    )}
                                                    {!product.attributes?.isHidden && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => toggleAvailability(product)}
                                                title={product.attributes?.isAvailable !== false ? "تعيين كغير متوفر" : "تعيين كمتوفر"}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${product.attributes?.isAvailable === false ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.name)}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
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
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 italic">لا توجد منتجات بعد</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ابدأ بإضافة منتجاتك الأولى الآن.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.length > 0 && (
                    <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold text-xs shadow-sm hover:text-indigo-600 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                            السابق
                        </button>
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20">1</button>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-400 font-bold text-xs shadow-sm hover:text-indigo-600 transition-all">
                            التالي
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <footer className="text-center pt-10 pb-5">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">© 2024 نظام إدارة التاجر. جميع الحقوق محفوظة لشركة النخبة للتجارة.</p>
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
                />
            )}
        </div>
    );
}
