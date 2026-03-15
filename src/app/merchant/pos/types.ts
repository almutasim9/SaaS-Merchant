export interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    sku?: string;
    stock_quantity: number;
    section_id?: string;
    attributes?: {
        hasVariants: boolean;
        variantOptions: any[];
        variantCombinations: any[];
    };
}

export interface CartItem extends Product {
    quantity: number;
    selections?: Record<string, string>;
}

export interface POSData {
    storeId: string;
    currency: string;
    merchantName: string;
    products: Product[];
    sections: any[];
}

export interface POSOrder {
    id: string;
    items: CartItem[];
    total: number;
    subtotal: number;
    discountAmount: number;
    created_at?: string;
    status?: string;
    customer_info?: any;
    delivery_fee?: number;
}

export interface POSState {
    cart: CartItem[];
    discount: {
        type: 'fixed' | 'percent';
        value: number;
    };
    customerInfo: any;
    deliveryFee: number;
    orderId: string | null;
    isSubmitting: boolean;
}

export type POSAction =
    | { type: 'ADD_ITEM'; item: CartItem }
    | { type: 'REMOVE_ITEM'; itemId: string; selections?: Record<string, string> }
    | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number; selections?: Record<string, string> }
    | { type: 'SET_DISCOUNT'; discount: { type: 'fixed' | 'percent'; value: number } }
    | { type: 'SET_CUSTOMER'; info: any }
    | { type: 'SET_DELIVERY_FEE'; fee: number }
    | { type: 'HYDRATE_ORDER'; order: any }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_SUBMITTING'; isSubmitting: boolean };
