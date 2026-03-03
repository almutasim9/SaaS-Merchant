import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('delivery_fees')
        .eq('slug', 'omar-store')
        .single();

    if (storeError) {
        console.error('Error fetching store:', storeError);
        return;
    }

    console.log('DELIVERY_FEES_JSON:', JSON.stringify(store.delivery_fees, null, 2));
}

run();
