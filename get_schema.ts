import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const tables = ['profiles', 'stores', 'subscription_plans', 'products', 'categories', 'sections', 'orders', 'order_items'];
    for (const table of tables) {
        console.log(`\n--- TABLE: ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Error or empty:`, error.message);
        } else if (data && data.length > 0) {
            console.log(Object.keys(data[0]).map(k => `  - ${k}`).join('\n'));
        } else {
            console.log('No data found, probing with an empty insert...');
            const { error: probe } = await supabase.from(table).insert({}).select('*');
            if (probe) {
                console.log('Probe error details to infer schema: ' + JSON.stringify(probe));
            } else {
                console.log('Insert succeeded (unexpected for empty object)');
            }
        }
    }
}
run();
