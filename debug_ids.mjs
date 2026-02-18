
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

async function debugIds() {
    try {
        const { data: stores } = await supabase.from('stores').select('id, name').limit(1)
        console.log('Sample Store ID:', stores?.[0]?.id)

        const { data: products } = await supabase.from('products').select('id, name').limit(1)
        console.log('Sample Product ID:', products?.[0]?.id)
    } catch (err) {
        console.error(err)
    }
}

debugIds()
