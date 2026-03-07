-- 1. Add ordering capabilities to subscription plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS enable_ordering BOOLEAN DEFAULT TRUE;

-- Update the Free plan to disable ordering (assuming Free plan price is 0 or it's identified by name)
UPDATE subscription_plans
SET enable_ordering = FALSE
WHERE price_monthly = 0 OR name_en ILIKE '%free%';

-- 2. Add preferences to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS accepts_orders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS offers_delivery BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS offers_pickup BOOLEAN DEFAULT FALSE;

-- 3. Update orders to store order type (delivery or pickup)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'delivery';

-- 4. Constraint for order_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'orders' AND constraint_name = 'valid_order_type'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT valid_order_type CHECK (order_type IN ('delivery', 'pickup'));
    END IF;
END $$;
