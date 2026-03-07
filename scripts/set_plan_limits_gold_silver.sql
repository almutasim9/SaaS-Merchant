-- 1. Ensure free_delivery_all_zones exists (it should, based on actions.ts)

-- 2. Update Free Plan (Ensure restrictions are set properly)
UPDATE public.subscription_plans
SET 
  max_products = 45,
  max_categories = 3,
  max_monthly_orders = 20,
  max_delivery_zones = 1,
  allow_variants = false,
  allow_social_links = false,
  allow_banner = false,
  allow_excel_import = false,
  allow_thermal_printing = false,
  free_delivery_all_zones = false
WHERE name_en = 'Free';

-- 3. Update Silver Plan (The Sweet Spot - Mid Tier)
UPDATE public.subscription_plans
SET 
  max_products = 250,
  max_categories = 15,
  max_monthly_orders = 500,
  max_delivery_zones = 3,
  allow_variants = true,
  allow_social_links = true,
  allow_banner = true,
  allow_excel_import = true,
  allow_thermal_printing = false,    -- Reserved for Gold
  free_delivery_all_zones = false,   -- Reserved for Gold
  custom_theme = false,              -- Reserved for Gold
  remove_branding = false,           -- Reserved for Gold
  allow_custom_slug = false          -- Reserved for Gold
WHERE name_en = 'Silver';

-- 4. Update Gold Plan (The VIP/Cashout Tier)
UPDATE public.subscription_plans
SET 
  max_products = -1,                 -- Unlimited
  max_categories = -1,               -- Unlimited
  max_monthly_orders = -1,           -- Unlimited
  max_delivery_zones = -1,           -- Unlimited
  allow_variants = true,
  allow_social_links = true,
  allow_banner = true,
  allow_excel_import = true,
  allow_thermal_printing = true,     -- Gold Exclusive
  free_delivery_all_zones = true,    -- Gold Exclusive
  custom_theme = true,               -- Gold Exclusive
  remove_branding = true,            -- Gold Exclusive
  allow_custom_slug = true           -- Gold Exclusive
WHERE name_en = 'Gold';
