'use server';

import { createClient as createServerClient, supabaseAdmin } from '@/lib/supabase-server';

// Helper to verify merchant session
async function verifyMerchantSession(userId: string) {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'merchant';
}

const MOCK_PRODUCTS = [
    { name: 'Classic Wireless Headphones', category: 'Electronics', price: 59.99, stock: 15, desc: 'Experience high-quality sound with these wireless headphones.', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
    { name: 'Modern Ceramic Vase', category: 'Home & Living', price: 24.50, stock: 8, desc: 'A minimalist vase to complement any home decor.', img: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=800' },
    { name: 'Organic Espresso Beans', category: 'Food', price: 18.00, stock: 50, desc: 'Rich and aromatic coffee beans for the perfect espresso.', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800' },
    { name: 'Ultra-Light Running Shoes', category: 'Fashion', price: 85.00, stock: 12, desc: 'Performance-driven shoes for your daily runs.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' },
    { name: 'Chef\'s Kitchen Knife', category: 'Home & Living', price: 45.99, stock: 5, desc: 'Professional-grade stainless steel knife for precise cutting.', img: 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800' },
    { name: 'Smart Fitness Tracker', category: 'Electronics', price: 39.99, stock: 25, desc: 'Monitor your health and activity with this sleek tracker.', img: 'https://images.unsplash.com/photo-1557167668-6ebe926273f0?w=800' },
    { name: 'Handcrafted Leather Wallet', category: 'Fashion', price: 49.00, stock: 10, desc: 'Genuine leather wallet with multiple card slots and a elegant design.', img: 'https://images.unsplash.com/photo-1627123430985-71d464a0b89f?w=800' },
    { name: 'Artisan Scented Candle', category: 'Home & Living', price: 12.99, stock: 30, desc: 'Create a relaxing atmosphere with this lavender-scented candle.', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800' },
    { name: 'Portable Bluetooth Speaker', category: 'Electronics', price: 29.99, stock: 20, desc: 'Take your music anywhere with this compact water-resistant speaker.', img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800' },
    { name: 'Premium Matcha Powder', category: 'Food', price: 22.50, stock: 40, desc: 'High-grade ceremonial matcha for tea or smoothies.', img: 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=800' },
    { name: 'Minimalist Wall Clock', category: 'Home & Living', price: 35.00, stock: 6, desc: 'Keep time in style with this elegant and silent wall clock.', img: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800' },
    { name: 'Gourmet Dark Chocolate', category: 'Food', price: 8.99, stock: 100, desc: 'Exquisite 70% dark chocolate made with sustainably sourced cocoa.', img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800' },
    { name: 'Professional Yoga Mat', category: 'Other', price: 55.00, stock: 15, desc: 'Non-slip, eco-friendly mat for your yoga and pilates sessions.', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cc8c7f?w=800' },
    { name: 'Vintage Polarized Sunglasses', category: 'Fashion', price: 65.00, stock: 18, desc: 'Classic retro style with modern UV400 protection lenses.', img: 'https://images.unsplash.com/photo-1511499767390-a733502666a4?w=800' },
    { name: 'Ergonomic Office Chair', category: 'Home & Living', price: 189.99, stock: 4, desc: 'Adjustable support and breathable mesh for maximum comfort.', img: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800' },
    { name: 'Electric Milk Frother', category: 'Home & Living', price: 19.99, stock: 35, desc: 'Make barista-style lattes and cappuccinos at home.', img: 'https://images.unsplash.com/photo-1570968015849-fb45596633e3?w=800' },
    { name: 'Travel Duffel Bag', category: 'Fashion', price: 75.50, stock: 7, desc: 'Durable and spacious bag for your weekend getaways.', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800' },
    { name: 'Mechanical Gaming Keyboard', category: 'Electronics', price: 110.00, stock: 10, desc: 'RGB lighting and tactile switches for a superior gaming experience.', img: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800' },
    { name: 'Bamboo Cutting Board Set', category: 'Home & Living', price: 28.00, stock: 20, desc: 'Three sizes of eco-friendly boards for all your kitchen needs.', img: 'https://images.unsplash.com/photo-1610705036342-14008ecbc416?w=800' },
    { name: 'Wireless Charging Pad', category: 'Electronics', price: 15.99, stock: 45, desc: 'Fast and convenient charging for all your Qi-compatible devices.', img: 'https://images.unsplash.com/photo-1586816829380-3636f3334c2a?w=800' }
];

export async function seedProductsAction(userId: string) {
    try {
        // 0. Auth Check
        const isValid = await verifyMerchantSession(userId);
        if (!isValid) return { success: false, error: 'غير مصرح لك بالقيام بهذا الإجراء.' };

        // 1. Get store_id
        const { data: storeData, error: storeError } = await supabaseAdmin
            .from('stores')
            .select('id')
            .eq('merchant_id', userId)
            .single();

        if (storeError || !storeData) {
            return { success: false, error: 'Store not found' };
        }

        const storeId = storeData.id;

        // 2. Prepare products
        const productsToInsert = MOCK_PRODUCTS.map(p => ({
            store_id: storeId,
            name: p.name,
            description: p.desc,
            price: p.price,
            category: p.category,
            stock_quantity: p.stock,
            image_url: p.img
        }));

        // 3. Insert products
        const { error: insertError } = await supabaseAdmin
            .from('products')
            .insert(productsToInsert);

        if (insertError) throw insertError;

        return { success: true };
    } catch (err: any) {
        console.error('Seeding error:', err);
        return { success: false, error: err.message };
    }
}
