-- ==========================================
-- secure_core_tables.sql
-- Description: Ensures RLS is enabled and correctly configured on core database tables.
-- ==========================================

-- 1. Enable RLS on core tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- 2. STORES Policies
DROP POLICY IF EXISTS "Merchants can view their own stores" ON public.stores;
CREATE POLICY "Merchants can view their own stores" ON public.stores
    FOR SELECT USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update their own stores" ON public.stores;
CREATE POLICY "Merchants can update their own stores" ON public.stores
    FOR UPDATE USING (auth.uid() = merchant_id);

-- 3. PRODUCTS Policies (Merchant Access)
DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;
CREATE POLICY "Merchants can manage their own products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- 4. SECTIONS Policies (Merchant Access)
DROP POLICY IF EXISTS "Merchants can manage their own sections" ON public.sections;
CREATE POLICY "Merchants can manage their own sections" ON public.sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = sections.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- 5. ORDERS Policies (Merchant Access)
DROP POLICY IF EXISTS "Merchants can view their own orders" ON public.orders;
CREATE POLICY "Merchants can view their own orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = orders.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Merchants can update their own orders" ON public.orders;
CREATE POLICY "Merchants can update their own orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = orders.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- 6. Public Access (Storefront)
-- These allow customers to browse without authentication
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
CREATE POLICY "Anyone can view active stores" ON public.stores
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view products of active stores" ON public.products;
CREATE POLICY "Anyone can view products of active stores" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = products.store_id
            AND stores.is_active = true
        )
    );

-- 7. Orders Insert (Public)
-- Allows customers to place orders
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
    FOR INSERT WITH CHECK (true);
