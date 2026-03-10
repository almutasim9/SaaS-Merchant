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
    console.log("Listing all tables in public schema...");
    const { data, error } = await supabase.rpc('get_tables' as any); // If RPC exists

    // Alternative: query a view that is usually readable
    const { data: tables, error: err } = await supabase
        .from('stores') // Use an existing table to check schema
        .select('name')
        .limit(1);

    // Let's try to get table names via a common hack if RPC fails
    const { data: schemaData, error: schemaErr } = await supabase.from('subscription_plans').select('id').limit(1);

    if (schemaErr) {
        console.log("Error selecting from subscription_plans:", schemaErr);
    } else {
        console.log("Successfully selected from subscription_plans.");
    }

    // Try to find if there are other tables starting with 'sub'
    // We can't easily list tables via PostgREST without a specific RPC.
    // Let's check for case sensitivity by trying to select from "Subscription_Plans"
    const { error: caseErr } = await supabase.from('Subscription_Plans').select('id').limit(1);
    console.log("Case sensitive check (Subscription_Plans):", caseErr ? "Error/Not found" : "Found!");
}

run();
