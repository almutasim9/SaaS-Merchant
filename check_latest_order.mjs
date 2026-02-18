
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

async function checkLatestOrder() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, store_id, customer_info, created_at')
            .order('created_at', { ascending: false })
            .limit(1)

        if (error) throw error
        console.log('Absolute Latest Order:', JSON.stringify(orders, null, 2))
    } catch (err) {
        console.error(err)
    }
}

checkLatestOrder()
