-- ============================================================================
-- Migration: Add updated_at columns + auto-update triggers
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Create the reusable trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Add updated_at to each table and create triggers

-- ── profiles ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── stores ───────────────────────────────────────────────────────────────────
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_stores_updated_at ON stores;
CREATE TRIGGER set_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── products ─────────────────────────────────────────────────────────────────
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── sections ─────────────────────────────────────────────────────────────────
ALTER TABLE sections
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_sections_updated_at ON sections;
CREATE TRIGGER set_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── orders ───────────────────────────────────────────────────────────────────
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ── subscription_plans ───────────────────────────────────────────────────────
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER set_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 3. Backfill existing rows (set updated_at = created_at for old data)
UPDATE profiles SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE stores SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE products SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE sections SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE subscription_plans SET updated_at = created_at WHERE updated_at IS NULL;


-- ============================================================================
-- Done! All tables now have auto-updating updated_at columns.
-- ============================================================================
