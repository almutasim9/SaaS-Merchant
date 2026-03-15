-- Database Performance Optimization: Composite Indexes
-- These indexes are designed to speed up common queries in the Merchant Dashboard, POS, and Storefront.

-- 1. Optimize Sales History & Order Tracking
-- Speeds up filtering orders by store and date (used in Merchant Sales History and POS).
CREATE INDEX IF NOT EXISTS idx_orders_store_created_at 
ON orders (store_id, created_at DESC);

-- 2. Optimize Dashboard Analytics
-- Speeds up merchant-level aggregations and role-based filtering.
CREATE INDEX IF NOT EXISTS idx_orders_merchant_created_at 
ON orders (merchant_id, created_at DESC);

-- 3. Optimize Storefront Catalog
-- Speeds up product listing by category and availability.
CREATE INDEX IF NOT EXISTS idx_products_store_category_available 
ON products (store_id, category, is_available) 
WHERE is_available = true;

-- 4. Optimize Store Lookups
-- Speeds up middleware and POS store resolution by merchant.
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id 
ON stores (merchant_id);

-- 5. Optimize Notification History
-- Speeds up notification fetching for specific stores.
CREATE INDEX IF NOT EXISTS idx_notifications_store_id_created_at 
ON notifications (store_id, created_at DESC);

-- 6. Optimize Inventory Lookups
-- Speeds up SKU-based stock checking in POS.
CREATE INDEX IF NOT EXISTS idx_products_store_sku 
ON products (store_id, sku) 
WHERE sku IS NOT NULL;
