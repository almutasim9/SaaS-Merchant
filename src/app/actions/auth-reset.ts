'use server';

import { createClient as createServerClient } from '@/lib/supabase-server';

export async function sendPasswordResetEmail(email: string) {
    if (!email || !email.includes('@')) {
        return { success: false, error: 'البريد الإلكتروني غير صحيح' };
    }

    try {
        const supabase = await createServerClient();

        // We ensure we redirect the user to our custom reset-password page
        const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: redirectUrl,
        });

        if (error) {
            console.error('[AUTH ERROR] sendPasswordResetEmail:', error);
            // Don't expose whether the email exists or not for security reasons
            // just return success or generic error
            return { success: false, error: 'حدث خطأ غير متوقع يرجى المحاولة لاحقاً' };
        }

        return { success: true };
    } catch (err: any) {
        console.error('[AUTH ERROR] Fatal sendPasswordResetEmail:', err);
        return { success: false, error: 'خطأ في السيرفر' };
    }
}

export async function updatePasswordAction(newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
    }

    try {
        const supabase = await createServerClient();

        // The user should already have an active session created by clicking the magic link
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('[AUTH ERROR] updatePasswordAction:', error);
            return { success: false, error: error.message || 'فشل تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية.' };
        }

        return { success: true };
    } catch (err: any) {
        console.error('[AUTH ERROR] Fatal updatePasswordAction:', err);
        return { success: false, error: 'خطأ في السيرفر' };
    }
}
