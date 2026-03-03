import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name, slug, delivery_fees');

    if (storeError) {
        console.error('Error fetching stores:', storeError);
        return;
    }

    console.log('STORES_LIST:', JSON.stringify(stores, null, 2));
}

run();
