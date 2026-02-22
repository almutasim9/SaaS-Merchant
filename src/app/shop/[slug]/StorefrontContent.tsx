'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { placeOrderAction } from '../actions';

// Components
import HomeView from './components/HomeView';
import ProductDetailsView from './components/ProductDetailsView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import FloatingCart from './components/FloatingCart';
import SideMenu from './components/SideMenu';
import AboutView from './components/AboutView';
import ContactView from './components/ContactView';

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
        isHidden?: boolean;
    };
    isAvailable?: boolean;
    isHidden?: boolean;
}

interface Store {
    id: string;
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo_url?: string;
    social_links?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
    };
    delivery_fees?: {
        baghdad: number;
        provinces: number;
    };
}

interface Section {
    id: string;
    name: string;
    image_url?: string;
}

export default function StorefrontContent({ store, products, sections }: { store: Store, products: Product[], sections: Section[] }) {
    const { cart, addToCart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

    // UI State
    const [view, setView] = useState<'home' | 'product' | 'cart' | 'checkout' | 'about' | 'contact'>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Unified filtering logic
    const visibleProducts = products.filter(p => {
        if (selectedSection) {
            const productCat = (p.category || '').trim().toLowerCase();
            const selectedCat = selectedSection.trim().toLowerCase();
            if (productCat !== selectedCat) return false;
        }

        const query = searchQuery.toLowerCase().trim();
        if (query && !p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) return false;

        if (p.attributes?.isHidden) return false;

        return true;
    });

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setView('product');
        window.scrollTo(0, 0);
    };

    const handleAddToCart = (item: any) => {
        addToCart(item);
    };

    const handlePlaceOrder = async (customerInfo: any) => {
        if (cart.length === 0) return;

        setIsOrdering(true);
        try {
            const orderItems = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                name: item.name,
                selections: (item as any).selections
            }));

            const result = await placeOrderAction({
                storeId: store.id,
                customerInfo,
                items: orderItems
            });

            if (!result.success) {
                alert('فشل إرسال الطلب: ' + result.error);
                return;
            }

            clearCart();
            setOrderSuccess(true);

            setTimeout(() => {
                setOrderSuccess(false);
                setView('home');
                setSelectedProduct(null);
            }, 5000);
        } catch (err: any) {
            alert('حدث خطأ غير متوقع أثناء إرسال الطلب.\n\nError: ' + err.message);
        } finally {
            setIsOrdering(false);
        }
    };

    const handleNavigate = (target: 'home' | 'about' | 'contact') => {
        setView(target);
        if (target === 'home') {
            setSelectedSection(null);
        }
        window.scrollTo(0, 0);
    };

    const renderView = () => {
        if (orderSuccess) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-[#E8FFF4] text-[#00D084] rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
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
                        storeLogo={store.logo_url}
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
                        deliveryFees={store.delivery_fees}
                    />
                );
            case 'about':
                return (
                    <AboutView
                        onBack={() => handleNavigate('home')}
                        storeName={store.name}
                        storeDescription={store.description}
                        storeLogo={store.logo_url}
                    />
                );
            case 'contact':
                return (
                    <ContactView
                        onBack={() => handleNavigate('home')}
                        storePhone={store.phone}
                        storeEmail={store.email}
                        socialLinks={store.social_links}
                    />
                );
            default:
                return (
                    <HomeView
                        products={visibleProducts}
                        sections={sections}
                        onProductClick={handleProductClick}
                        onAddToCart={handleAddToCart}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedSection={selectedSection}
                        setSelectedSection={setSelectedSection}
                        storeName={store.name}
                        storeDescription={store.description}
                        storePhone={store.phone}
                        storeEmail={store.email}
                        storeAddress={store.address}
                        storeLogo={store.logo_url}
                        socialLinks={store.social_links}
                        onMenuOpen={() => setIsMenuOpen(true)}
                        onCartOpen={() => setView('cart')}
                        totalItems={totalItems}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans">
            {renderView()}

            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                storeName={store.name}
                storeLogo={store.logo_url}
                activeView={view}
            />

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
                .safe-area-bottom {
                    padding-bottom: max(1rem, env(safe-area-inset-bottom));
                }
            `}</style>
        </div>
    );
}
