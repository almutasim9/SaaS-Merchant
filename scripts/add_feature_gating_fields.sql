-- Feature Gating: Add new boolean columns to subscription_plans
-- Run this migration in Supabase SQL Editor

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS allow_variants BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_excel_import BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_social_links BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_banner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS features_ar text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features_en text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features_ku text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description_ar text,
ADD COLUMN IF NOT EXISTS description_en text,
ADD COLUMN IF NOT EXISTS description_ku text;

-- Update Free plan with the correct limits
UPDATE subscription_plans
SET
    max_products = 45,
    max_categories = 3,
    max_delivery_zones = 1,
    max_monthly_orders = 20,
    allow_custom_slug = false,
    allow_variants = false,
    allow_excel_import = false,
    allow_social_links = false,
    allow_banner = false,
    custom_theme = true,
    remove_branding = false,
    advanced_reports = false,
    enable_ordering = true,
    description_ar = 'الباقة الأساسية لبدء تجارتك الإلكترونية',
    description_en = 'The essential plan to start your online business',
    description_ku = 'پلانی بنەڕەتی بۆ دەستپێکردنی بازرگانی ئەلیکترۆنیت',
    features_ar = ARRAY['إضافة 45 منتج', 'إضافة 3 أقسام', 'استقبال 20 طلب شهرياً', 'منطقة توصيل واحدة', 'تخصيص واجهة المتجر']::text[],
    features_en = ARRAY['Add up to 45 products', 'Create up to 3 categories', 'Receive 20 orders per month', '1 Delivery zone', 'Storefront customization']::text[],
    features_ku = ARRAY['زیادکردنی ٤٥ بەرهەم', 'زیادکردنی ٣ بەش', 'وەرگرتنی ٢٠ داواکاری مانگانە', '١ ناوچەی گەیاندن', 'ڕێکخستنی ڕووکار']::text[]
WHERE name_en = 'Free';

-- Update Silver/Gold plans to have everything unlocked
UPDATE subscription_plans
SET
    max_products = 99999,
    max_categories = 99999,
    max_delivery_zones = 99999,
    max_monthly_orders = 99999,
    allow_custom_slug = true,
    allow_variants = true,
    allow_excel_import = true,
    allow_social_links = true,
    allow_banner = true,
    custom_theme = true,
    remove_branding = true,
    advanced_reports = true,
    enable_ordering = true,
    description_ar = 'الباقة المتكاملة لنمو متجرك بدون قيود',
    description_en = 'The complete plan to grow your store without limits',
    description_ku = 'پلانی تەواو بۆ گەشەکردنی فرۆشگاکەت بێ سنوور',
    features_ar = ARRAY['عدد لامحدود من المنتجات والأقسام', 'طلبات ومناطق توصيل غير محدودة', 'روابط تواصل اجتماعي وبانر ترويجي', 'متغيرات المنتجات واستيراد Excel', 'تغيير رابط المتجر وإزالة الحقوق']::text[],
    features_en = ARRAY['Unlimited products & categories', 'Unlimited orders & delivery zones', 'Social links & promotional banner', 'Product variants & Excel import', 'Custom store URL & brand removal']::text[],
    features_ku = ARRAY['بەرهەم و بەشی بێ سنوور', 'داواکاری و ناوچەی گەیاندن بێ سنوور', 'بەستەری سۆشیاڵ میدیا و بانەری ڕیکلام', 'گۆڕانکارییەکانی بەرهەم و هێنانی ئێکسڵ', 'گۆڕینی بەستەری فرۆشگا و لابردنی لۆگۆ']::text[]
WHERE name_en IN ('Silver', 'Gold');
