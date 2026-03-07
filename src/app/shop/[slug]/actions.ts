'use server';

import { createClient } from '@/lib/supabase-server';

export async function recordVisitAction(storeId: string, source: 'link' | 'qr') {
    if (!storeId) return { success: false, error: 'Store ID is required' };

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('store_visits')
            .insert({ store_id: storeId, source });

        if (error) {
            console.error('Error recording visit:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Server error recording visit:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
