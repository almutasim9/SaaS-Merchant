export interface Profile {
    id: string;
    full_name: string;
    role: string;
    phone_number?: string;
    created_at: string;
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
    social_links?: any;
    delivery_fees?: number;
    email?: string;
    storefront_config?: any;
    plan_id: string;
    plan_expires_at?: string;
    plan_started_at?: string;
    created_at: string;
}

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
    description_ar?: string;
    description_en?: string;
    description_ku?: string;
    yearly_discount_percent?: number;
    created_at: string;
}

export interface Section {
    id: string;
    store_id: string;
    name: string;
    image_url?: string;
    created_at: string;
}

export interface Product {
    id: string;
    store_id: string;
    name: string;
    description?: string;
    price: number;
    section_id: string;
    image_url?: string;
    stock_quantity: number;
    rating?: number;
    is_featured: boolean;
    discount_price?: number;
    attributes?: any;
    deleted_at?: string;
    created_at: string;
}

export interface OrderItem {
    id?: string;
    product_id?: string; // Legacy support
    name: string;
    product_name?: string; // Legacy support
    price: number;
    quantity: number;
    image_url?: string;
    selections?: any;
}

export interface Order {
    id: string;
    store_id: string;
    customer_info: {
        name: string;
        phone: string;
        address?: string;
    };
    items: OrderItem[];
    total_price: number;
    delivery_fee?: number;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'completed' | 'cancelled';
    governorate?: string;
    cancellation_reason?: string;
    deleted_at?: string;
    created_at: string;
}
