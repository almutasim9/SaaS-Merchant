import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) {
        acc[match[1]] = match[2].replace(/"/g, '').trim();
    }
    return acc;
}, {} as Record<string, string>);

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching subscription_plans columns...");
    const { data, error } = await supabase.from('subscription_plans').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    if (data && data.length > 0) {
        console.log("Existing columns:", Object.keys(data[0]));
    } else {
        console.log("Table is empty, trying to get columns via RPC or metadata...");
        // If table is empty, we can try to insert and rollback or just use a generic query
        const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'subscription_plans' });
        console.log("Columns from RPC:", cols);
    }
}

run();
