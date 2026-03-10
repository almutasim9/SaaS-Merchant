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
    console.log("Searching for subscription_plans table in all schemas...");
    const { data, error } = await supabase.rpc('inspect_table', { t_name: 'subscription_plans' });

    // If RPC doesn't exist, use generic SQL query via a temporary table if allowed, or just trust information_schema
    const { data: info, error: infoErr } = await supabase
        .from('information_schema.tables' as any)
        .select('table_schema, table_name')
        .ilike('table_name', '%subscription_plan%');

    if (infoErr) {
        // information_schema might be restricted via PostgREST
        console.log("Could not query information_schema directly. Checking public directly...");
        const { data: publicCheck } = await supabase.from('subscription_plans').select('id').limit(1);
        if (publicCheck) {
            console.log("Table exists in public schema (verified via direct select).");
        }
    } else {
        console.log("Found tables:", info);
    }
}

run();
