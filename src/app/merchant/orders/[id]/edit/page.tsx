'use client';

import { useState, useEffect, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { updateOrderDetailsAction } from '../../actions';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Types & Utils from POS
import { Product, CartItem, POSData } from '../../../pos/types';
import { calculateSubtotal, findCombination } from '../../../pos/utils';
import { usePOS } from '../../../pos/hooks/usePOS';
import { useStore } from '../../../hooks/useStore';

// Components from POS
import { CartSidebar } from '../../../pos/components/CartSidebar';
import { ProductGrid } from '../../../pos/components/ProductGrid';
import { VariantModal } from '../../../pos/components/VariantModal';
import { DiscountModal } from '../../../pos/components/DiscountModal';

export default function OrderEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: orderId } = use(params);
    const router = useRouter();
    
    // POS State Machine
    const {
        state: pos,
        subtotal,
        discountAmount,
        total: finalTotal,
        addToCart: addToCartBase,
        removeFromCart,
        updateQuantity: updateQuantityBase,
        setDiscount,
        setCustomer,
        setDeliveryFee,
        hydrateOrder,
        setSubmitting: setIsUpdating,
    } = usePOS();
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('all');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: store } = useStore();

    // Data Fetching
    const { data: pageData, isLoading } = useQuery<POSData & { order: any }>({
        queryKey: ['order-edit-data', orderId, store?.id],
        enabled: !!store?.id,
        queryFn: async () => {
            if (!store) throw new Error('Store not available');

            const [productsRes, sectionsRes, orderRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('id, name, price, image_url, attributes, section_id, sku, stock_quantity')
                    .eq('store_id', store.id)
                    .is('deleted_at', null),
                supabase
                    .from('sections')
                    .select('id, name')
                    .eq('store_id', store.id),
                supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single()
            ]);

            if (orderRes.error) throw orderRes.error;

            return {
                storeId: store.id,
                currency: store.currency_preference,
                merchantName: store.name,
                products: (productsRes.data || []) as Product[],
                sections: sectionsRes.data || [],
                order: orderRes.data
            };
        }
    });

    // Hydrate state once data is loaded
    useEffect(() => {
        if (pageData?.order) {
            hydrateOrder(pageData.order);
        }
    }, [pageData?.order, hydrateOrder]);

    // Cart Logic (Reused from POS)
    const addToCart = (product: Product) => {
        if (product.attributes?.hasVariants) {
            setSelectedProduct(product);
            const initialOpts: Record<string, string> = {};
            product.attributes.variantOptions.forEach(opt => {
                if (opt.values && opt.values.length > 0) initialOpts[opt.id] = opt.values[0];
            });
            setSelectedVariantOptions(initialOpts);
            return;
        }
        addToCartBase({ ...product, quantity: 1 });
    };

    const confirmVariantAddition = () => {
        if (!selectedProduct) return;
        const combination = findCombination(selectedProduct, selectedVariantOptions);
        const cartItem: CartItem = {
            ...selectedProduct,
            price: combination ? combination.price : selectedProduct.price,
            quantity: 1,
            selections: selectedVariantOptions
        };
        addToCartBase(cartItem);
        setSelectedProduct(null);
        toast.success(`تمت إضافة ${selectedProduct.name} للسلة`);
    };

    const updateQuantity = (productId: string, delta: number, selections?: any) => {
        const item = pos.cart.find((i: CartItem) => 
            i.id === productId && 
            JSON.stringify(i.selections || {}) === JSON.stringify(selections || {})
        );
        if (item) {
            updateQuantityBase(productId, item.quantity + delta, selections);
        }
    };

    const filteredProducts = (pageData?.products || []).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSection = activeSection === 'all' || p.section_id === activeSection;
        return matchesSearch && matchesSection;
    });

    const handleUpdateOrder = async () => {
        if (pos.cart.length === 0 || pos.isSubmitting) return;
        setIsUpdating(true);
        try {
            const result = await updateOrderDetailsAction(orderId, {
                customer_info: pos.customerInfo,
                items: pos.cart,
                total_price: finalTotal,
                delivery_fee: pos.deliveryFee
            });

            if (result.success) {
                toast.success('تم تحديث الطلب بنجاح');
                router.push('/merchant/orders');
            } else {
                toast.error(result.error || 'فشل تحديث الطلب');
            }
        } catch (error) {
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`
            ${isFullScreen ? 'fixed inset-0 z-[100] bg-slate-50 font-sans' : 'h-screen bg-slate-50 overflow-hidden font-sans'} 
            flex
        `} dir="rtl">
            
            <CartSidebar 
                cart={pos.cart}
                currency={pageData?.currency || ''}
                subtotal={subtotal}
                discount={pos.discount}
                discountAmount={discountAmount}
                deliveryFee={pos.deliveryFee}
                total={finalTotal}
                isCheckingOut={pos.isSubmitting}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onClearCart={() => hydrateOrder(pageData?.order)}
                onShowDiscountModal={() => setShowDiscountModal(true)}
                onCheckout={handleUpdateOrder}
                checkoutLabel="تحديث الطلب (Update Order)"
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Reusing ProductGrid structure but maybe with custom header for editing */}
                <ProductGrid 
                    products={filteredProducts}
                    currency={pageData?.currency || ''}
                    isLoading={isLoading}
                    activeSection={activeSection}
                    sections={pageData?.sections || []}
                    searchQuery={searchQuery}
                    onSectionChange={setActiveSection}
                    onSearchChange={setSearchQuery}
                    onAddToCart={addToCart}
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                    onShowHistory={() => router.push('/merchant/orders')}
                    lastScannedCode={null}
                    merchantName={`تعديل طلب #${pageData?.order.id.slice(-6)}`}
                    searchInputRef={searchInputRef}
                    showScannerStatus={false}
                    showHistory={false}
                />
                
                {/* Customer Info Quick Edit - Bottom Bar or similar? */}
                <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-6">
                    <div className="flex gap-4 items-center overflow-x-auto no-scrollbar pb-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">الاسم</span>
                            <input 
                                value={pos.customerInfo?.name || ''} 
                                onChange={e => setCustomer({...pos.customerInfo, name: e.target.value})}
                                className="text-sm font-bold text-black border-none focus:ring-0 bg-transparent p-0 w-32"
                            />
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">الهاتف</span>
                            <input 
                                value={pos.customerInfo?.phone || ''} 
                                onChange={e => setCustomer({...pos.customerInfo, phone: e.target.value})}
                                className="text-sm font-bold text-black border-none focus:ring-0 bg-transparent p-0 w-32"
                            />
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">رسوم التوصيل</span>
                            <input 
                                type="number"
                                value={pos.deliveryFee} 
                                onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                                className="text-sm font-bold text-black border-none focus:ring-0 bg-transparent p-0 w-24"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => router.push('/merchant/orders')}
                        className="px-6 py-2 bg-slate-100 text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-all active:scale-95"
                    >
                        إلغاء والتراجع
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedProduct && (
                    <VariantModal 
                        product={selectedProduct}
                        selectedOptions={selectedVariantOptions}
                        currency={pageData?.currency || ''}
                        onOptionChange={(id, val) => setSelectedVariantOptions(prev => ({ ...prev, [id]: val }))}
                        onClose={() => setSelectedProduct(null)}
                        onConfirm={confirmVariantAddition}
                    />
                )}

                {showDiscountModal && (
                    <DiscountModal 
                        isOpen={showDiscountModal}
                        onClose={() => setShowDiscountModal(false)}
                        discount={pos.discount}
                        onDiscountChange={setDiscount}
                    />
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />
        </div>
    );
}
