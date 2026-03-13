-- =========================================================
-- CONSOLIDATED SQL FOR NOTIFICATIONS AND CATALOG ORDERING
-- =========================================================

-- 1. MERCHANT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL, 
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'order',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for notifications
ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for merchants to view their notifications
DROP POLICY IF EXISTS "Merchants can view their notifications" ON public.merchant_notifications;
CREATE POLICY "Merchants can view their notifications" ON public.merchant_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = merchant_notifications.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Policy for merchants to mark as read
DROP POLICY IF EXISTS "Merchants can update their notifications" ON public.merchant_notifications;
CREATE POLICY "Merchants can update their notifications" ON public.merchant_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = merchant_notifications.store_id
            AND stores.merchant_id = auth.uid()
        )
    );

-- Enable Realtime for notifications
-- Note: If this fails, it might be because the table is already in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'merchant_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_notifications;
    END IF;
END $$;

-- 2. CATALOG ORDERING (Sections & Products)
-- Add display_order to sections
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add display_order to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON public.sections(display_order);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);
