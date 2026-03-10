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
    console.log("Checking singular form: subscription_plan...");
    const { error } = await supabase.from('subscription_plan').select('id').limit(1);
    if (!error) {
        console.log("Found table: subscription_plan!");
    } else {
        console.log("Not subscription_plan:", error.message);
    }
}

run();
