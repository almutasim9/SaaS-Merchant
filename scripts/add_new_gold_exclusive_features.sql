-- 1. Add new feature flags
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS allow_category_images boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_multiple_product_images boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_about_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_order_reception_options boolean DEFAULT false;

-- 2. Update Free Plan (No access to new features)
UPDATE public.subscription_plans
SET 
  allow_category_images = false,
  allow_multiple_product_images = false,
  allow_about_page = false,
  allow_order_reception_options = false,
  allow_banner = false -- ensuring it's false
WHERE name_en = 'Free';

-- 3. Update Silver Plan (No access to new features, plus restricting banner per user request)
UPDATE public.subscription_plans
SET 
  allow_category_images = false,
  allow_multiple_product_images = false,
  allow_about_page = false,
  allow_order_reception_options = false,
  allow_banner = false -- Moving banner to Gold Exclusive
WHERE name_en = 'Silver';

-- 4. Update Gold Plan (Full Access)
UPDATE public.subscription_plans
SET 
  allow_category_images = true,
  allow_multiple_product_images = true,
  allow_about_page = true,
  allow_order_reception_options = true,
  allow_banner = true
WHERE name_en = 'Gold';
