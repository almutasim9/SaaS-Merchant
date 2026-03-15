import { createClient, supabaseAdmin } from '@/lib/supabase-server';
import { Metadata } from 'next';
import { CartProvider } from '@/context/CartContext';
import StorefrontContent from './StorefrontContent';
import { cache } from 'react';

// Cache for 1 hour — store data rarely changes, eliminates most cold-start delays
export const revalidate = 3600;

interface Props {
    params: Promise<{ slug: string }>;
}

// Deduplicate the store fetch — generateMetadata and ShopPage share one query
const getStoreBySlug = cache(async (slug: string) => {
    const supabase = await createClient();
    return supabase
        .from('stores')
        .select('id, name, description, phone, email, address, logo_url, social_links, delivery_fees, storefront_config, currency_preference, accepts_orders, offers_delivery, offers_pickup, subscription_plans (enable_ordering, custom_theme, remove_branding)')
        .eq('slug', slug)
        .single();
});

// Pre-render popular stores at build time — eliminates cold starts entirely
export async function generateStaticParams() {
    // Use admin client here because generateStaticParams runs outside request scope
    // and createClient() would fail due to cookies() call
    const { data: stores } = await supabaseAdmin
        .from('stores')
        .select('slug');

    return (stores || []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const { data: store } = await getStoreBySlug(slug);

    return {
        title: store ? `${store.name} | Proudly Powered by Platform` : 'Store Not Found',
        description: `Shop the latest products from ${store?.name || 'our stores'}.`,
    };
}

export default async function ShopPage({ params }: Props) {
    const { slug } = await params;

    // 1. Fetch Store Details (deduplicated with generateMetadata via cache())
    const { data: store, error: storeError } = await getStoreBySlug(slug);

    if (storeError || !store) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 animate-bounce">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-black mb-2">404 - Store Not Found</h1>
                <p className="text-black max-w-sm mb-8 font-medium">Ops! We couldn&apos;t find any store matching this link. It might have been moved or renamed.</p>
            </div>
        );
    }

    // 2. Fetch Sections and Products in Parallel
    const supabase = await createClient();
    const [sectionsRes, productsRes] = await Promise.all([
        supabase
            .from('sections')
            .select('id, name, name_en, name_ku, image_url, display_order')
            .eq('store_id', store.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true }),
        supabase
            .from('products')
            .select('id, name, name_en, name_ku, description, description_en, description_ku, price, section_id, image_url, attributes, stock_quantity, display_order')
            .eq('store_id', store.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(100)
    ]);

    const sections = sectionsRes.data || [];
    const products = (productsRes.data || []).map(p => {
        const attrs = p.attributes as any || {};
        const combos = attrs.variantCombinations || [];
        const hasVariants = attrs.hasVariants || (combos.length > 0);
        
        // Recalculate total stock from variants if they exist
        const totalStock = hasVariants 
            ? combos.reduce((acc: number, c: any) => acc + (parseInt(c.stock_quantity) || 0), 0)
            : p.stock_quantity;

        return { ...p, stock_quantity: totalStock };
    }).filter(p => {
        if (p.stock_quantity > 0) return true;
        
        const attrs = p.attributes as any || {};
        // If stock is 0, check how long it's been out of stock
        if (attrs?.out_of_stock_since) {
            const since = new Date(attrs.out_of_stock_since);
            const now = new Date();
            const diffDays = (now.getTime() - since.getTime()) / (1000 * 3600 * 24);
            // Hide if it's been out of stock for more than 14 days
            if (diffDays > 14) return false;
        }
        return true;
    });

    // Calculate if the store can receive orders
    const acceptsOrdersFlag = store.accepts_orders !== false; // Default true
    const plans = store.subscription_plans;
    const planAllowsOrdering = Array.isArray(plans) ? (plans[0] as any)?.enable_ordering !== false : (plans as any)?.enable_ordering !== false;
    const canReceiveOrders = acceptsOrdersFlag && planAllowsOrdering;

    return (
        <CartProvider storeSlug={slug}>
            <StorefrontContent
                store={store}
                products={products || []}
                sections={sections || []}
                canReceiveOrders={canReceiveOrders}
            />
        </CartProvider>
    );
}
