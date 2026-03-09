import type { OrderStatus } from './order-statuses';

// ── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
    id: string;
    full_name: string;
    role: 'super_admin' | 'merchant';
    phone_number?: string;
    created_at: string;
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface SocialLinks {
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    telegram?: string;
}

export interface StorefrontConfig {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    heroImage?: string;
    bannerText?: string;
    showRatings?: boolean;
    layoutStyle?: 'grid' | 'list';
}

export interface DeliveryZone {
    id: string;
    name: string;
    cities: string[];
    fee: number;
    enabled: boolean;
    freeDeliveryThreshold?: number | null;
}

export interface DeliveryFees {
    zones: DeliveryZone[];
    isFreeDelivery?: boolean;
    /** @deprecated Legacy fields — use zones[] instead */
    baghdad?: number;
    /** @deprecated Legacy fields — use zones[] instead */
    provinces?: number;
}

export interface Store {
    id: string;
    merchant_id: string;
    subdomain?: string;
    logo_url?: string;
    is_active: boolean;
    name: string;
    slug: string;
    currency: string;
    phone?: string;
    address?: string;
    description?: string;
    social_links?: SocialLinks;
    delivery_fees?: DeliveryFees;
    accepts_orders?: boolean;
    offers_delivery?: boolean;
    offers_pickup?: boolean;
    email?: string;
    storefront_config?: StorefrontConfig;
    plan_id: string;
    plan_expires_at?: string;
    plan_started_at?: string;
    created_at: string;
}

// ── Subscription Plans ───────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: string;
    name_ar: string;
    name_en: string;
    price_monthly: number;
    max_products: number;
    max_categories: number;
    custom_theme: boolean;
    remove_branding: boolean;
    advanced_reports: boolean;
    max_delivery_zones: number;
    free_delivery_all_zones: boolean;
    allow_custom_slug: boolean;
    max_monthly_orders: number;
    enable_ordering?: boolean;
    allow_variants?: boolean;
    allow_excel_import?: boolean;
    allow_social_links?: boolean;
    allow_banner?: boolean;
    allow_thermal_printing?: boolean;
    allow_category_images?: boolean;
    allow_multiple_product_images?: boolean;
    allow_about_page?: boolean;
    allow_order_reception_options?: boolean;
    description_ar?: string;
    description_en?: string;
    description_ku?: string;
    yearly_discount_percent?: number;
    price_yearly?: number;
    created_at: string;
}

// ── Sections ─────────────────────────────────────────────────────────────────

export interface Section {
    id: string;
    store_id: string;
    name: string;
    name_en?: string;
    name_ku?: string;
    image_url: string | null;
    created_at: string;
}

// ── Products & Variants ──────────────────────────────────────────────────────

export interface VariantOption {
    id: string;
    name: string;
    values: string[];
}

export interface VariantCombination {
    id: string;
    options: Record<string, string>;
    price: string;
    isUnavailable?: boolean;
}

export interface ProductAttributes {
    hasVariants?: boolean;
    variantOptions?: VariantOption[];
    variantCombinations?: VariantCombination[];
    isAvailable?: boolean;
    isHidden?: boolean;
    /** @deprecated Use variantOptions/variantCombinations instead */
    weightPrices?: Record<string, string>;
}

export interface Product {
    id: string;
    store_id: string;
    section_id: string;
    name: string;
    name_en?: string;
    name_ku?: string;
    description: string | null;
    description_en?: string;
    description_ku?: string;
    price: number;
    image_url: string | null;
    stock_quantity: number;
    rating?: number;
    is_featured: boolean;
    discount_price?: number;
    attributes: ProductAttributes | null;
    deleted_at?: string;
    created_at: string;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    selections?: Record<string, string>;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    city?: string;
    landmark?: string;
    notes?: string;
    address?: string;
}

export interface Order {
    id: string;
    store_id: string;
    customer_info: CustomerInfo;
    items: OrderItem[];
    total_price: number;
    delivery_fee?: number;
    status: OrderStatus;
    currency_preference?: 'IQD' | 'USD';
    order_type?: 'delivery' | 'pickup';
    governorate?: string;
    cancellation_reason?: string;
    deleted_at?: string;
    created_at: string;
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface StoreVisit {
    id: string;
    store_id: string;
    source: 'link' | 'qr';
    visitor_id?: string;
    created_at: string;
}
