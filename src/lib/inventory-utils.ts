import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Adjusts product stock for simple products and products with variants.
 * @param supabase Authenticated Supabase client
 * @param productId Product ID
 * @param quantityDelta Amount to change stock by (negative to decrease, positive to increase)
 * @param selections Optional variant selections (human-readable format as stored in order items)
 */
export async function adjustProductStock(
    supabase: SupabaseClient,
    productId: string,
    quantityDelta: number,
    selections?: Record<string, any>
) {
    // 1. Get current product data
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('attributes, stock_quantity')
        .eq('id', productId)
        .single();

    if (fetchError || !product) {
        console.error(`Error fetching product ${productId} for stock adjustment:`, fetchError);
        return { success: false, error: 'Product not found' };
    }

    const attrs = (product.attributes as any) || {};
    let newTotalStock = product.stock_quantity;
    const updatedAttributes = { ...attrs };

    // 2. Handle Variants
    if (selections && Object.keys(selections).length > 0 && attrs.variantCombinations) {
        const variantOptions = attrs.variantOptions || [];
        const variantCombinations = attrs.variantCombinations || [];

        // Convert human-readable selection keys to option IDs
        const optionMap: Record<string, string> = {};
        for (const [humanName, selectedValue] of Object.entries(selections)) {
            const opt = variantOptions.find((o: any) => o.name === humanName);
            if (opt) optionMap[opt.id] = selectedValue as string;
        }

        if (Object.keys(optionMap).length > 0) {
            const sortedKeys = ObjectsToSortedKeys(optionMap);
            const comboId = sortedKeys.map(k => `${k}:${optionMap[k]}`).join('|');
            
            let variantFound = false;
            const updatedCombinations = variantCombinations.map((c: any) => {
                if (c.id === comboId) {
                    variantFound = true;
                    return { 
                        ...c, 
                        stock_quantity: Math.max(0, (parseInt(c.stock_quantity) || 0) + quantityDelta).toString() 
                    };
                }
                return c;
            });

            if (variantFound) {
                newTotalStock = updatedCombinations.reduce((acc: number, c: any) => acc + (parseInt(c.stock_quantity) || 0), 0);
                updatedAttributes.variantCombinations = updatedCombinations;
            }
        }
    } else {
        // 3. Handle Simple Product
        newTotalStock = Math.max(0, product.stock_quantity + quantityDelta);
    }

    // 4. Update out_of_stock_since
    updatedAttributes.out_of_stock_since = newTotalStock === 0 
        ? (attrs.out_of_stock_since || new Date().toISOString()) 
        : null;

    // 5. Save updates
    const { error: updateError } = await supabase
        .from('products')
        .update({ 
            stock_quantity: newTotalStock,
            attributes: updatedAttributes
        })
        .eq('id', productId);

    if (updateError) {
        console.error(`Error updating stock for product ${productId}:`, updateError);
        return { success: false, error: 'Database update failed' };
    }

    return { success: true, newStock: newTotalStock };
}

function ObjectsToSortedKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj).sort();
}
