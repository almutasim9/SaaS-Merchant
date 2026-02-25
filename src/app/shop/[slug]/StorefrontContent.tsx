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
    category?: string;
    section_id?: string;
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
    storefront_config?: {
        banner?: { title?: string; subtitle?: string; badge?: string; show?: boolean; images?: string[] };
        about?: { content?: string };
        theme_color?: string;
    };
    subscription_plans?: {
        custom_theme: boolean;
        remove_branding: boolean;
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
    const [orderNumber, setOrderNumber] = useState<string>('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Unified filtering logic
    const visibleProducts = products.filter(p => {
        if (selectedSection) {
            const section = sections.find(s => s.name === selectedSection);
            if (section) {
                if (p.section_id !== section.id) return false;
            } else {
                return false;
            }
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
            setOrderNumber(result.orderId ? `#${String(result.orderId).slice(-5)}` : `#${Math.floor(10000 + Math.random() * 90000)}`);
            setOrderSuccess(true);
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

    const handleBackFromSuccess = () => {
        setOrderSuccess(false);
        setOrderNumber('');
        setView('home');
        setSelectedProduct(null);
        window.scrollTo(0, 0);
    };

    const renderView = () => {
        if (orderSuccess) {
            return (
                <div className="min-h-screen bg-[#F8F9FB]" dir="rtl">
                    {/* Green Header */}
                    <div className="bg-gradient-to-b from-[#E8FFF4] to-[#F8F9FB] pt-16 pb-10 flex flex-col items-center text-center px-6">
                        <div className="w-24 h-24 bg-[var(--theme-primary)] rounded-full flex items-center justify-center shadow-xl shadow-sm mb-6">
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">تم إرسال طلبك بنجاح!</h2>
                        <p className="text-sm text-slate-500 leading-6">شكراً لشرائك منا، سنتواصل معك قريباً<br />لتأكيد تفاصيل الطلب والشحن.</p>
                    </div>

                    {/* Order Info Card */}
                    <div className="mx-5 -mt-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                        <p className="text-xs text-slate-400 mb-1">رقم الطلب</p>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                            <span className="text-2xl font-black text-slate-800">{orderNumber}</span>
                        </div>
                        <div className="flex items-center justify-around border-t border-slate-100 pt-4">
                            <div>
                                <p className="text-xs text-slate-400">طريقة الدفع</p>
                                <p className="text-sm font-bold text-slate-700">دفع عند الاستلام</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400">تاريخ الطلب</p>
                                <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Banner */}
                    <div className="mx-5 mt-4 bg-gradient-to-l from-[var(--theme-primary)] to-[color-mix(in_srgb,var(--theme-primary)_70%,black)] rounded-2xl overflow-hidden p-6 text-center relative">
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10" />
                        <p className="text-white font-bold text-lg relative z-10">نصلك منتجاتنا أينما كنت 📦</p>
                    </div>

                    {/* Buttons */}
                    <div className="mx-5 mt-6 space-y-3 pb-10">
                        <button
                            onClick={handleBackFromSuccess}
                            className="w-full py-3.5 bg-[var(--theme-primary)] text-white font-bold rounded-xl hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            العودة للرئيسية
                        </button>

                        {store.social_links?.whatsapp && (
                            <a
                                href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن طلبي رقم ${orderNumber}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-200 hover:border-green-300 hover:bg-green-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                تواصل معنا عبر واتساب
                            </a>
                        )}
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
                        aboutContent={store.storefront_config?.about?.content}
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
                        storefrontConfig={{
                            ...store.storefront_config,
                            banner: {
                                ...store.storefront_config?.banner,
                                // Force disable slider images if plan doesn't support it
                                images: store.subscription_plans?.custom_theme ? store.storefront_config?.banner?.images : []
                            }
                        }}
                    />
                );
        }
    };

    const isCustomThemeAllowed = store.subscription_plans?.custom_theme ?? false;
    const themeColor = isCustomThemeAllowed ? (store.storefront_config?.theme_color || '#00D084') : '#00D084';

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans" style={{ '--theme-primary': themeColor } as any}>
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
