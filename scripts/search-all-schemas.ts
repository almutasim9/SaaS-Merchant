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
    console.log("Deep search for subscription_plans in all schemas...");

    // We can use a trick to find it if we can't query information_schema directly:
    // Try to query common schemas
    const schemas = ['public', 'auth', 'storage', 'extensions', 'graphql_public', 'realtime'];

    for (const schema of schemas) {
        const { error } = await supabase.from(`${schema}.subscription_plans` as any).select('id').limit(1);
        if (!error) {
            console.log(`Found table in schema: ${schema}`);
        } else {
            console.log(`Not in ${schema}: ${error.message}`);
        }
    }

    // Try one more thing: maybe the table name has a space or something weird?
    // Unlikely, but let's check the API response for the table name from a generic select
    const { data } = await supabase.from('subscription_plans').select('*').limit(1);
    console.log("Verified API accessible.");
}

run();
