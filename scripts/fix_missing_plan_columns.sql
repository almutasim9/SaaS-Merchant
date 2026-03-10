-- Add missing columns to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS price_yearly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS allow_category_images BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_multiple_product_images BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_about_page BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_order_reception_options BOOLEAN DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN public.subscription_plans.price_yearly IS 'Annual subscription price';
COMMENT ON COLUMN public.subscription_plans.allow_category_images IS 'Whether the plan allow uploading images for categories';
COMMENT ON COLUMN public.subscription_plans.allow_multiple_product_images IS 'Whether the plan allow uploading multiple images per product';
COMMENT ON COLUMN public.subscription_plans.allow_about_page IS 'Whether the plan allows having a custom "About Us" page';
COMMENT ON COLUMN public.subscription_plans.allow_order_reception_options IS 'Whether the plan allows customizing order reception options';
