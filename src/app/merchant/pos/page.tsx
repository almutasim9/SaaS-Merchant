'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { createPOSOrderAction, refundPOSOrderAction } from './actions';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

// Types & Hooks
import { Product, CartItem, POSData, POSOrder } from './types';
import { calculateSubtotal, handlePrintReceipt, findCombination } from './utils';
import { usePOS } from './hooks/usePOS';
import { useStore } from '../hooks/useStore';

// Components
import { CartSidebar } from './components/CartSidebar';
import { ProductGrid } from './components/ProductGrid';
import { VariantModal } from './components/VariantModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { DiscountModal } from './components/DiscountModal';
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';

export default function POSPage() {
    // POS State Machine
    const {
        state: pos,
        subtotal,
        discountAmount,
        total,
        addToCart: addToCartBase,
        removeFromCart,
        updateQuantity: updateQuantityBase,
        setDiscount,
        clearCart,
        setSubmitting: setIsCheckingOut,
    } = usePOS();

    const [hasAccess, setHasAccess] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('all');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [lastOrder, setLastOrder] = useState<POSOrder | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: store } = useStore();

    // Data Fetching
    const { data: pageData, isLoading, refetch } = useQuery<POSData>({
        queryKey: ['pos-data', store?.id],
        enabled: !!store?.id,
        queryFn: async () => {
            if (!store) throw new Error('Store data not available');

            const planName = (store.subscription_plans as any)?.name_en || 'Free';
            if (planName !== 'Gold') {
                setHasAccess(false);
                return {
                    storeId: store.id,
                    currency: store.currency_preference,
                    merchantName: store.name,
                    products: [],
                    sections: []
                };
            }

            const [productsRes, sectionsRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('id, name, price, image_url, attributes, section_id, sku, stock_quantity')
                    .eq('store_id', store.id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('sections')
                    .select('id, name')
                    .eq('store_id', store.id)
            ]);

            return {
                storeId: store.id,
                currency: store.currency_preference,
                merchantName: store.name,
                products: (productsRes.data || []) as Product[],
                sections: sectionsRes.data || []
            };
        }
    });

    const isGold = (store?.subscription_plans as any)?.name_en === 'Gold';

    const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ['pos-history', pageData?.storeId],
        queryFn: async () => {
            if (!pageData?.storeId) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('store_id', pageData.storeId)
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data || [];
        },
        enabled: !!pageData?.storeId && showHistoryModal
    });

    // Barcode Scanner
    useEffect(() => {
        if (searchInputRef.current) searchInputRef.current.focus();

        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            if (currentTime - lastKeyTime > 50) barcodeBuffer = '';

            if (e.key === 'Enter') {
                if (barcodeBuffer.length > 2) {
                    setLastScannedCode(barcodeBuffer);
                    const foundProduct = pageData?.products.find(p => p.sku === barcodeBuffer);
                    if (foundProduct) {
                        addToCart(foundProduct);
                        setSearchQuery('');
                        toast.success(`تمت إضافة: ${foundProduct.name}`, { icon: '🛒' });
                    } else {
                        toast.error(`الباركود غير موجود: ${barcodeBuffer}`);
                    }
                    barcodeBuffer = '';
                }
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageData]);

    // Cart Logic
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

    // Actions
    const handleCheckout = async () => {
        if (pos.cart.length === 0 || pos.isSubmitting) return;
        setIsCheckingOut(true);
        try {
            const result = await createPOSOrderAction(pos.cart, total);
            if (result.success) {
                setLastOrder({
                    id: result.orderId,
                    items: [...pos.cart],
                    total,
                    subtotal,
                    discountAmount
                });
                clearCart();
                toast.success('تمت عملية البيع بنجاح!');
                refetch();
            } else {
                toast.error('حدث خطأ أثناء إتمام البيع', { description: result.error });
            }
        } catch (error) {
            toast.error('فشل الاتصال بالخادم');
        } finally {
            setIsCheckingOut(false);
            if (searchInputRef.current) searchInputRef.current.focus();
        }
    };

    const handleRefund = async (orderId: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في إرجاع هذا الطلب؟ سيتم إعادة المنتجات للمخزون.')) return;
        const result = await refundPOSOrderAction(orderId);
        if (result.success) {
            toast.success('تم إرجاع الطلب بنجاح');
            refetchHistory();
            refetch();
        } else {
            toast.error(result.error || 'فشلت عملية الإرجاع');
        }
    };

    const handlePartialRefund = async (orderId: string, item: any) => {
        if (!confirm(`هل أنت متأكد من إرجاع ${item.name}؟`)) return;
        // @ts-ignore
        const { partialRefundPOSOrderAction } = await import('./actions');
        const res = await partialRefundPOSOrderAction(orderId, [{ ...item, quantity: item.quantity }]);
        if (res.success) {
            toast.success('تم إرجاع المنتج بنجاح');
            refetchHistory();
            refetch();
        } else {
            toast.error(res.error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4" dir="rtl">
                <div className="bg-white rounded-[2rem] p-8 lg:p-12 max-w-md w-full text-center border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-inner relative z-10 border border-amber-100/50">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-black mb-4 tracking-tight relative z-10">نظام البيع للمحترفين 💰</h2>
                    <p className="text-black font-medium mb-10 leading-relaxed text-sm lg:text-base relative z-10">
                        نظام "نقطة البيع" (POS) المتكامل متوفر حصرياً لمشتركي <span className="text-amber-600 font-bold">الباقة الذهبية</span>. قم بترقية باقتك للبدء بالبيع مباشرة من مكتبك!
                    </p>
                    <a href="/merchant/billing" className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 relative z-10 active:scale-95">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        ترقية الباقة الآن
                    </a>
                </div>
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
                total={total}
                isCheckingOut={pos.isSubmitting}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onClearCart={clearCart}
                onShowDiscountModal={() => setShowDiscountModal(true)}
                onCheckout={handleCheckout}
            />

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
                onShowHistory={() => setShowHistoryModal(true)}
                lastScannedCode={lastScannedCode}
                merchantName={pageData?.merchantName || ''}
                searchInputRef={searchInputRef}
            />

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

                {showHistoryModal && (
                    <OrderHistoryModal 
                        isOpen={showHistoryModal}
                        onClose={() => setShowHistoryModal(false)}
                        historyData={historyData || []}
                        isLoading={loadingHistory}
                        currency={pageData?.currency || ''}
                        onPrintReceipt={(o) => handlePrintReceipt(o, pageData?.currency, pageData?.merchantName)}
                        onRefund={handleRefund}
                        onPartialRefund={handlePartialRefund}
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

                {lastOrder && (
                    <CheckoutSuccessModal 
                        order={lastOrder}
                        currency={pageData?.currency || ''}
                        onClose={() => setLastOrder(null)}
                        onPrintReceipt={(o) => handlePrintReceipt(o, pageData?.currency, pageData?.merchantName)}
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
