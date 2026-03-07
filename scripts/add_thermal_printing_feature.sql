-- Feature Gating: Add thermal printing support to subscription_plans
-- Run this migration in Supabase SQL Editor

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS allow_thermal_printing BOOLEAN DEFAULT false;

-- Disable for Free plan
UPDATE subscription_plans
SET allow_thermal_printing = false
WHERE name_en = 'Free';

-- Enable for Silver and Gold plans
UPDATE subscription_plans
SET allow_thermal_printing = true
WHERE name_en IN ('Silver', 'Gold');
