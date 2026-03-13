-- Create merchant notifications table
CREATE TABLE IF NOT EXISTS public.merchant_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'order', 'system', 'billing', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchant_notifications_merchant_id ON public.merchant_notifications(merchant_id);

-- Enable RLS
ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;

-- Allow merchants to see their own notifications
CREATE POLICY "Merchants can view own notifications"
ON public.merchant_notifications FOR SELECT
USING (auth.uid() = merchant_id);

-- Allow merchants to mark their own notifications as read
CREATE POLICY "Merchants can update own notifications"
ON public.merchant_notifications FOR UPDATE
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- Enable Realtime for this table
ALTER publication supabase_realtime ADD TABLE public.merchant_notifications;
