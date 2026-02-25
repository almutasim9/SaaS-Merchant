import { createClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import { CartProvider } from '@/context/CartContext';
import StorefrontContent from './StorefrontContent';

export const revalidate = 60;

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('slug', slug)
        .single();

    return {
        title: store ? `${store.name} | Proudly Powered by Platform` : 'Store Not Found',
        description: `Shop the latest products from ${store?.name || 'our stores'}.`,
    };
}

export default async function ShopPage({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Fetch Store Details
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, description, phone, email, address, logo_url, social_links, delivery_fees, storefront_config, subscription_plan_id, subscription_plans(custom_theme, remove_branding)')
        .eq('slug', slug)
        .single();

    if (storeError || !store) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 animate-bounce">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - Store Not Found</h1>
                <p className="text-slate-500 max-w-sm mb-8 font-medium">Ops! We couldn&apos;t find any store matching this link. It might have been moved or renamed.</p>
            </div>
        );
    }

    // 2. Fetch Sections and Products in Parallel
    const [sectionsRes, productsRes] = await Promise.all([
        supabase
            .from('sections')
            .select('id, name, image_url')
            .eq('store_id', store.id)
            .order('created_at', { ascending: true }),
        supabase
            .from('products')
            .select('id, name, description, price, section_id, image_url, attributes, stock_quantity')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
            .limit(40)
    ]);

    const sections = sectionsRes.data || [];
    const products = productsRes.data || [];

    return (
        <CartProvider>
            <StorefrontContent store={store} products={products || []} sections={sections || []} />
        </CartProvider>
    );
}
