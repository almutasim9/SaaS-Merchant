
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(s => s.trim()))
)

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
)

async function listTables() {
    try {
        const { data, error } = await supabase.rpc('get_tables') // if it exists
        if (error) {
            // Fallback: Query pg_catalog
            const { data: tables, error: pgError } = await supabase
                .from('pg_catalog.pg_tables')
                .select('tablename')
                .eq('schemaname', 'public')

            if (pgError) throw pgError
            console.log('Tables:', tables.map(t => t.tablename))
        } else {
            console.log('Tables:', data)
        }
    } catch (err) {
        // Just try a few common tables
        const tables = ['products', 'stores', 'orders', 'profiles', 'product_variants', 'categories']
        for (const table of tables) {
            const { error } = await supabase.from(table).select('id').limit(1)
            console.log(`Table ${table} exists:`, !error)
        }
    }
}

listTables()
