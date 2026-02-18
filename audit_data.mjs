
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

async function countData() {
    const tables = ['products', 'stores', 'orders', 'profiles']
    console.log('--- Database Audit ---')
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.log(`Table ${table}: Error or not found`)
        } else {
            console.log(`Table ${table}: ${count} rows`)
        }
    }
}

countData()
