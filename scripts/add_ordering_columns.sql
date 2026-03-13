-- Add display_order to categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add display_order to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);
