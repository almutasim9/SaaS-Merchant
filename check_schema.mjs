
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

async function checkSchema() {
    try {
        console.log('--- Orders Table ---')
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(1)

        if (ordersError) console.error(ordersError)
        else {
            if (orders && orders.length > 0) {
                console.log('Orders columns:', Object.keys(orders[0]))
            } else {
                console.log('Orders table is empty, trying to fetch schema via rpc or just return no columns.')
            }
        }

        console.log('\n--- Products Table ---')
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(1)

        if (productsError) console.error(productsError)
        else {
            if (products && products.length > 0) {
                console.log('Products columns:', Object.keys(products[0]))
            } else {
                console.log('Products table is empty.')
            }
        }
    } catch (err) {
        console.error('Fatal error:', err.message)
    }
}

checkSchema()
