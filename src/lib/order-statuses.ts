/**
 * Centralized Order Status Definitions
 * Single source of truth for all order statuses across the platform.
 */

export const ORDER_STATUSES = {
    pending: 'pending',
    processing: 'processing',
    shipped: 'shipped',
    completed: 'completed',
    returned: 'returned',
    cancelled: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

/** Active statuses shown in the merchant orders dashboard (not finalized). */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped'];

/** Final statuses — orders that are done and shouldn't appear in active list. */
export const FINAL_ORDER_STATUSES: OrderStatus[] = ['completed', 'returned', 'cancelled'];

export interface StatusConfig {
    label_ar: string;
    label_en: string;
    label_ku: string;
    badgeClass: string;
    /** Toast message shown when merchant transitions to this status */
    toastMessage: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    pending: {
        label_ar: 'معلق',
        label_en: 'Pending',
        label_ku: 'چاوەڕوان',
        badgeClass: 'bg-amber-50 text-amber-600',
        toastMessage: 'تم إعادة الطلب للمعلقة',
    },
    processing: {
        label_ar: 'قيد التجهيز',
        label_en: 'Processing',
        label_ku: 'لە ئامادەکردندایە',
        badgeClass: 'bg-indigo-50 text-black',
        toastMessage: 'موافقة ✅ — الطلب قيد التجهيز',
    },
    shipped: {
        label_ar: 'سلم للمندوب',
        label_en: 'Shipped',
        label_ku: 'پێشکەشکرا',
        badgeClass: 'bg-blue-50 text-blue-600',
        toastMessage: 'تم التسليم للمندوب 🚚',
    },
    completed: {
        label_ar: 'مكتمل / مستلم',
        label_en: 'Completed',
        label_ku: 'تەواوبوو',
        badgeClass: 'bg-emerald-50 text-emerald-600',
        toastMessage: 'مكتمل بنجاح ✅',
    },
    returned: {
        label_ar: 'راجع / مرفوض',
        label_en: 'Returned',
        label_ku: 'گەڕێنراوە',
        badgeClass: 'bg-rose-50 text-rose-600',
        toastMessage: 'تم تسجيل الإرجاع 🔁',
    },
    cancelled: {
        label_ar: 'ملغي',
        label_en: 'Cancelled',
        label_ku: 'هەڵوەشێنراوە',
        badgeClass: 'bg-slate-100 text-black',
        toastMessage: 'تم إلغاء الطلب ❌',
    },
};

/** Filter tabs for the merchant orders page. */
export const ORDER_FILTER_TABS = [
    { value: 'all' as const, label_ar: 'الكل', label_en: 'All', label_ku: 'هەموو' },
    ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
        value: value as OrderStatus,
        label_ar: config.label_ar,
        label_en: config.label_en,
        label_ku: config.label_ku,
    })),
];
