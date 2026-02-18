
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

async function cleanData() {
    console.log('--- Cleaning Level 1: Orders & Products ---')

    // 1. Delete Orders (no dependencies depending on them)
    const { count: orderCount, error: orderError } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .not('id', 'is', null) // filter to match all rows

    if (orderError) {
        console.error('Error deleting orders:', orderError)
    } else {
        console.log(`Successfully deleted ${orderCount} orders.`)
    }

    // 2. Delete Products
    const { count: productCount, error: productError } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .not('id', 'is', null)

    if (productError) {
        console.error('Error deleting products:', productError)
    } else {
        console.log(`Successfully deleted ${productCount} products.`)
    }
}

cleanData()
