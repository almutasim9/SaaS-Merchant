'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { placeOrderAction } from '../actions';

// Components
import HomeView from './components/HomeView';
import ProductDetailsView from './components/ProductDetailsView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import FloatingCart from './components/FloatingCart';
import SideMenu from './components/SideMenu';

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
    stock_quantity?: number;
    attributes?: {
        isAvailable?: boolean;
        outOfStockBehavior?: 'hide' | 'show_badge';
    };
}

interface Store {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    image_url?: string;
}

export default function StorefrontContent({ store, products, sections }: { store: Store, products: Product[], sections: Section[] }) {
    const { cart, addToCart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

    // UI State
    const [view, setView] = useState<'home' | 'product' | 'cart' | 'checkout'>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Unified filtering logic
    const visibleProducts = products.filter(p => {
        // Filter by section (Robust case-insensitive match)
        if (selectedSection) {
            const productCat = (p.category || '').trim().toLowerCase();
            const selectedCat = selectedSection.trim().toLowerCase();
            if (productCat !== selectedCat) return false;
        }

        // Filter by search query
        const query = searchQuery.toLowerCase().trim();
        if (query && !p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) return false;

        // Filter by availability (hide IF specifically marked to hide when unavailable)
        if (p.attributes?.isAvailable === false && p.attributes?.outOfStockBehavior === 'hide') return false;

        return true;
    });

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setView('product');
        window.scrollTo(0, 0);
    };

    const handleAddToCart = (item: any) => {
        addToCart(item);
        // Optional: Show toast or jump to cart? 
        // For now, let's just stay on the page.
    };

    const handlePlaceOrder = async (customerInfo: any) => {
        if (cart.length === 0) {
            console.warn('[CLIENT] Attempted to place order with empty cart.');
            return;
        }

        console.log('[CLIENT] handlePlaceOrder started for store:', store.id);
        setIsOrdering(true);
        try {
            // Prepare items for server-side validation
            const orderItems = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                selectedWeight: (item as any).selectedWeight,
                name: item.name // passing name for logging/fallback
            }));

            console.log('[CLIENT] Sending order items:', orderItems);
            console.log('[CLIENT] Customer info:', customerInfo);

            const result = await placeOrderAction({
                storeId: store.id,
                customerInfo,
                items: orderItems
            });

            console.log('[CLIENT] Server Action result:', result);

            if (!result.success) {
                console.error('[CLIENT] Order failed:', result.error);
                alert('فشل إرسال الطلب: ' + result.error);
                return;
            }

            console.log('[CLIENT] Order successful! Clearing cart and showing success screen.');
            setOrderSuccess(true);
            clearCart();

            // Show success for 5 seconds then back home
            setTimeout(() => {
                console.log('[CLIENT] Success timeout finished. Returning home.');
                setOrderSuccess(false);
                setView('home');
                setSelectedProduct(null);
            }, 5000);
        } catch (err: any) {
            console.error('[CLIENT] Unexpected error in handlePlaceOrder:', err);
            alert('حدث خطأ غير متوقع أثناء إرسال الطلب. يرجى مراجعة الاتصال والمحاولة مرة أخرى.\n\nError: ' + err.message);
        } finally {
            setIsOrdering(false);
        }
    };

    const renderView = () => {
        if (orderSuccess) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-800">تم إرسال الطلب بنجاح!</h2>
                        <p className="text-slate-500 font-medium">شكراً لتسوقك معنا. سنتواصل معك قريباً.</p>
                    </div>
                </div>
            );
        }

        switch (view) {
            case 'product':
                return selectedProduct ? (
                    <ProductDetailsView
                        product={selectedProduct}
                        onBack={() => setView('home')}
                        onAddToCart={handleAddToCart}
                    />
                ) : null;
            case 'cart':
                return (
                    <CartView
                        items={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onContinue={() => setView('checkout')}
                        onBack={() => setView('home')}
                        totalPrice={totalPrice}
                    />
                );
            case 'checkout':
                return (
                    <CheckoutView
                        totalPrice={totalPrice}
                        onBack={() => setView('cart')}
                        onPlaceOrder={handlePlaceOrder}
                        isOrdering={isOrdering}
                    />
                );
            default:
                return (
                    <div className="pb-10">
                        {/* Header with Navigation */}
                        <header className="sticky top-0 z-50 bg-[#F8F9FB]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4" dir="rtl">
                            <h1 className="text-xl font-bold text-slate-800 tracking-tighter cursor-pointer" onClick={() => setView('home')}>{store.name}</h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                            </div>
                        </header>
                        <HomeView
                            products={visibleProducts}
                            allProducts={products}
                            sections={sections}
                            onProductClick={handleProductClick}
                            onAddToCart={handleAddToCart}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            selectedSection={selectedSection}
                            setSelectedSection={setSelectedSection}
                            storeName={store.name}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans">
            {/* Main Content Area */}
            {renderView()}

            {/* Side Navigation Menu */}
            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(v) => {
                    if (v === 'home') {
                        setView('home');
                        setSelectedSection(null);
                    }
                }}
                storeName={store.name}
            />

            {/* Floating Cart Button */}
            {!orderSuccess && view === 'home' && (
                <FloatingCart
                    totalItems={totalItems}
                    onClick={() => setView('cart')}
                />
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
