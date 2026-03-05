-- 1. Add currency_preference to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS currency_preference VARCHAR(3) DEFAULT 'IQD';

-- 2. Add constraint to ensure it's either IQD or USD (Optional but recommended for data integrity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'stores' AND constraint_name = 'valid_currency'
    ) THEN
        ALTER TABLE stores
        ADD CONSTRAINT valid_currency CHECK (currency_preference IN ('IQD', 'USD'));
    END IF;
END $$;
