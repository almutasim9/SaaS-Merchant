import { z } from 'zod';

export const CustomerInfoSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين'),
    phone: z.string().min(7, 'رقم الهاتف غير صحيح'),
    city: z.string().min(2, 'يجب اختيار المدينة'),
    landmark: z.string().optional(),
    notes: z.string().optional(),
});

export const OrderItemSchema = z.object({
    id: z.string().uuid('معرف المنتج غير صحيح'),
    quantity: z.number().int().positive('الكمية يجب أن تكون أكبر من صفر'),
    selectedWeight: z.string().optional(),
});

export const PlaceOrderSchema = z.object({
    storeId: z.string().uuid('معرف المتجر غير صحيح'),
    customerInfo: CustomerInfoSchema,
    items: z.array(OrderItemSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
});

export const MerchantRegistrationSchema = z.object({
    storeName: z.string().min(3, 'اسم المتجر قصير جداً'),
    ownerName: z.string().min(2, 'اسم المالك قصير جداً'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    phone: z.string().min(7, 'رقم الهاتف غير صحيح'),
    slug: z.string().min(3, 'الرابط الفرعي قصير جداً').regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على حروف وأرقام وعلامة - فقط'),
    category: z.string(),
    subscriptionType: z.enum(['basic', 'pro', 'enterprise']),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});
