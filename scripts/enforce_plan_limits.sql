-- ==========================================
-- enforce_plan_limits.sql
-- Description: Enforces subscription plan limits at the database level using Triggers.
-- ==========================================

-- 1. Helper function to check product limits
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_products INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Get the max_products limit for the store's plan
    SELECT sp.max_products INTO v_max_products
    FROM public.stores s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.id = NEW.store_id;

    -- Count existing non-deleted products
    SELECT COUNT(*) INTO v_current_count
    FROM public.products
    WHERE store_id = NEW.store_id AND deleted_at IS NULL;

    IF v_current_count >= v_max_products THEN
        RAISE EXCEPTION 'لقد وصلت إلى الحد الأقصى للمنتجات المسموح به في خطتك (% منتج). يرجى ترقية الخطة لإضافة المزيد.', v_max_products;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for product insert
DROP TRIGGER IF EXISTS trig_check_product_limit ON public.products;
CREATE TRIGGER trig_check_product_limit
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_product_limit();


-- 3. Helper function to check category (section) limits
CREATE OR REPLACE FUNCTION public.check_category_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_categories INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Get the max_categories limit for the store's plan
    SELECT sp.max_categories INTO v_max_categories
    FROM public.stores s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.id = NEW.store_id;

    -- Count existing sections
    SELECT COUNT(*) INTO v_current_count
    FROM public.sections
    WHERE store_id = NEW.store_id;

    IF v_current_count >= v_max_categories THEN
        RAISE EXCEPTION 'لقد وصلت إلى الحد الأقصى للأقسام المسموح به في خطتك (% أقسام). يرجى ترقية الخطة لإضافة المزيد.', v_max_categories;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for category insert
DROP TRIGGER IF EXISTS trig_check_category_limit ON public.sections;
CREATE TRIGGER trig_check_category_limit
    BEFORE INSERT ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION public.check_category_limit();
