
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

async function debugSchema() {
    try {
        const { data, error } = await supabase.from('products').select('*').limit(1)
        if (error) throw error
        console.log('Product Sample:', Object.keys(data[0]))
    } catch (err) {
        console.error('Schema Error:', err)
    }
}

debugSchema()
