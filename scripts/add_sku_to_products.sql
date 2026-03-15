-- Add SKU column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add index for faster searching by SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Update existing products with a temporary SKU if they don't have one (optional, but keep it null for now as per discussion)
-- UPDATE public.products SET sku = 'PROD-' || id::text WHERE sku IS NULL;

COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - Unique identifier for the product';
