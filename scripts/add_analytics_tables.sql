-- ==========================================
-- add_analytics_tables.sql
-- Description: Creates the store_visits table to track analytics (Link vs QR).
-- ==========================================

-- 1. Create store_visits table
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('link', 'qr')),
    visitor_id TEXT, -- Optional: IP hash or session ID for unique visits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_visits_store_id ON public.store_visits(store_id);
CREATE INDEX IF NOT EXISTS idx_store_visits_created_at ON public.store_visits(created_at);

-- 3. Enable RLS
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Anyone can insert a visit (the public storefront needs this)
CREATE POLICY "Anyone can insert a store visit"
ON public.store_visits FOR INSERT
TO public
WITH CHECK (true);

-- Store owners can view their own analytics
CREATE POLICY "Store owners can view their visits"
ON public.store_visits FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.stores
        WHERE stores.id = store_visits.store_id
        AND stores.merchant_id = auth.uid()
    )
);

-- Super admins can view all visits
CREATE POLICY "Super admins can view all visits"
ON public.store_visits FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);
