import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Find a product with variants in omar-store
    const { data: store } = await supabase.from('stores').select('id').eq('slug', 'omar-store').single();
    if (!store) return;

    const { data: products } = await supabase
        .from('products')
        .select('id, name, attributes')
        .eq('store_id', store.id)
        .limit(10);

    const productWithVariants = products?.find(p => p.attributes?.hasVariants);
    if (!productWithVariants) {
        console.log('No product with variants found for testing.');
        return;
    }

    const attributes = productWithVariants.attributes;
    if (attributes.variantCombinations && attributes.variantCombinations.length > 0) {
        // Mark the first combination as unavailable
        attributes.variantCombinations[0].isUnavailable = true;

        const { error } = await supabase
            .from('products')
            .update({ attributes })
            .eq('id', productWithVariants.id);

        if (error) {
            console.error('Error updating product:', error);
        } else {
            const comboName = attributes.variantCombinations[0].id; // e.g. "S|Red" or similar
            console.log(`Successfully marked variant "${comboName}" of product "${productWithVariants.name}" as unavailable for testing.`);
        }
    }
}

run();
