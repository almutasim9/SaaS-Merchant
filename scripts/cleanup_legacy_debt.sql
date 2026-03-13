-- =========================================================
-- CLEANUP SCRIPT: REMOVE LEGACY DEBT
-- =========================================================

-- 1. DROP LEGACY TABLES (Verify they are empty before running)
DROP TABLE IF EXISTS public.restaurants;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.plans;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.subscriptions;

-- 2. CLEANUP STORES TABLE
-- Remove columns that have been replaced by better alternatives
ALTER TABLE public.stores 
DROP COLUMN IF EXISTS currency,  -- Replaced by currency_preference
DROP COLUMN IF EXISTS subdomain, -- Replaced by slug
DROP COLUMN IF EXISTS category;  -- Redundant with section-based organization

-- 3. CLEANUP PRODUCTS TABLE
-- Remove columns that are not used in the current business logic
ALTER TABLE public.products
DROP COLUMN IF EXISTS category; -- Redundant with section_id

-- 4. VERIFY REMAINING CORE SCHEMA
-- The following tables are the HEART of the application:
-- profiles, stores, sections, products, orders, merchant_notifications, merchant_fcm_tokens, subscription_plans
