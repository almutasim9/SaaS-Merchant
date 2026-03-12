-- Migration: Create merchant_fcm_tokens table

-- Table Definition
CREATE TABLE IF NOT EXISTS public.merchant_fcm_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(merchant_id, token) -- Prevent duplicate tokens for the same merchant
);

-- Foreign Key Constraint (Assuming a merchants or users table exists. We'll link it to auth.users for safety or leave it as a reference if it's a specific tenant ID)
-- ALTER TABLE public.merchant_fcm_tokens ADD CONSTRAINT fk_merchant FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.merchant_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow users to insert their own tokens
CREATE POLICY "Users can insert their own tokens" ON public.merchant_fcm_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = merchant_id);

-- Allow users to view their own tokens
CREATE POLICY "Users can view their own tokens" ON public.merchant_fcm_tokens
    FOR SELECT
    USING (auth.uid() = merchant_id);

-- Allow users to delete their own tokens
CREATE POLICY "Users can delete their own tokens" ON public.merchant_fcm_tokens
    FOR DELETE
    USING (auth.uid() = merchant_id);
