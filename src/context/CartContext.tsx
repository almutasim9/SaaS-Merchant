'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string; // product ID
    cartKey: string; // unique key = productId + selections hash
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    selections?: Record<string, string>; // e.g. { "اللون": "#000000", "المقاس": "XL" }
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (cartKey: string) => void;
    updateQuantity: (cartKey: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a unique cart key based on product ID and selections
function generateCartKey(productId: string, selections?: Record<string, string>): string {
    if (!selections || Object.keys(selections).length === 0) return productId;
    const sortedEntries = Object.entries(selections).sort(([a], [b]) => a.localeCompare(b));
    const selStr = sortedEntries.map(([k, v]) => `${k}:${v}`).join('|');
    return `${productId}__${selStr}`;
}

export const CartProvider = ({ children, storeSlug }: { children: React.ReactNode; storeSlug?: string }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const storageKey = storeSlug ? `shopping-cart-${storeSlug}` : 'shopping-cart';

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem(storageKey);
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                    // Migration: add cartKey if missing (for old cart items)
                    const migrated = parsedCart.map((item: any) => ({
                        ...item,
                        cartKey: item.cartKey || generateCartKey(item.id, item.selections)
                    }));
                    setCart(migrated);
                }
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any) => {
        const selections = product.selections || undefined;
        const cartKey = generateCartKey(product.id, selections);

        setCart((prev) => {
            const existing = prev.find((item) => item.cartKey === cartKey);
            if (existing) {
                return prev.map((item) =>
                    item.cartKey === cartKey
                        ? { ...item, quantity: item.quantity + (product.quantity || 1) }
                        : item
                );
            }
            return [...prev, {
                id: product.id,
                cartKey,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: product.quantity || 1,
                selections
            }];
        });
    };

    const removeFromCart = (cartKey: string) => {
        setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
    };

    const updateQuantity = (cartKey: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartKey);
            return;
        }
        setCart((prev) =>
            prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
