import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: store, error: storeError } = await supabase.from('stores').select('id').eq('slug', 'omar-store').single();
    if (storeError || !store) {
        console.error('Store not found', storeError || 'omar-store does not exist');
        return;
    }
    const storeId = store.id;

    let { data: section } = await supabase.from('sections').select('id').eq('store_id', storeId).limit(1).single();
    if (!section) {
        const { data: newSection, error: sectionError } = await supabase.from('sections')
            .insert({ store_id: storeId, name: 'المنتجات الجديدة' })
            .select('id').single();
        if (sectionError) throw sectionError;
        section = newSection;
    }
    const sectionId = section.id;

    // Helper to generate combinations
    const generateCombos = (options: { id: string, values: string[] }[], prices: Record<string, string> = {}, basePrice: number) => {
        const generate = (opts: { id: string, values: string[] }[], currentIdx: number, currentCombo: Record<string, string>): Record<string, string>[] => {
            if (currentIdx === opts.length) return [currentCombo];
            const option = opts[currentIdx];
            let results: Record<string, string>[] = [];
            for (const value of option.values) {
                results = results.concat(generate(opts, currentIdx + 1, { ...currentCombo, [option.id]: value }));
            }
            return results;
        };

        const raw = generate(options, 0, {});
        return raw.map(comboMap => {
            const sortedKeys = Object.keys(comboMap).sort();
            const comboId = sortedKeys.map(k => `${k}:${comboMap[k]}`).join('|');
            // Check if comboId matches a specific price, or else empty (default price)
            return {
                id: comboId,
                options: comboMap,
                price: prices[comboId] || ''
            };
        });
    };

    // T-shirt Product
    const tsOptColorId = `opt-${Date.now()}-1`;
    const tsOptSizeId = `opt-${Date.now()}-2`;
    const tsOptions = [
        { id: tsOptColorId, name: 'اللون', values: ['#EF4444', '#3B82F6', '#10B981'] },
        { id: tsOptSizeId, name: 'المقاس', values: ['S', 'M', 'L', 'XL'] }
    ];
    // Custom price for XL Red
    const tsPrices = {
        [`${tsOptColorId}:#EF4444|${tsOptSizeId}:XL`]: '18',
        [`${tsOptColorId}:#3B82F6|${tsOptSizeId}:XL`]: '18',
        [`${tsOptColorId}:#10B981|${tsOptSizeId}:XL`]: '18',
    };

    // Coffee Table Product
    const tableOptColorId = `opt-${Date.now()}-3`;
    const tableOptDimId = `opt-${Date.now()}-4`;
    const tableOptions = [
        { id: tableOptColorId, name: 'اللون', values: ['أبيض', 'أسود', 'خشبي'] },
        { id: tableOptDimId, name: 'الأبعاد', values: ['50x50 cm', '80x80 cm', '120x60 cm'] }
    ];
    const tablePrices = {
        [`${tableOptColorId}:خشبي|${tableOptDimId}:120x60 cm`]: '150',
        [`${tableOptColorId}:أبيض|${tableOptDimId}:120x60 cm`]: '140',
        [`${tableOptColorId}:أسود|${tableOptDimId}:120x60 cm`]: '140',
    };

    // Shoes Product
    const shoesOptColorId = `opt-${Date.now()}-5`;
    const shoesOptSizeId = `opt-${Date.now()}-6`;
    const shoesOptions = [
        { id: shoesOptColorId, name: 'اللون', values: ['#000000', '#FFFFFF'] },
        { id: shoesOptSizeId, name: 'المقاس', values: ['41', '42', '43', '44'] }
    ];

    const products = [
        {
            store_id: storeId,
            name: "تيشيرت قطني صيفي",
            description: "تيشيرت قطني مريح متوفر بعدة ألوان ومقاسات. مقاس XL بسعر مختلف.",
            price: 15.00,
            section_id: sectionId,
            stock_quantity: 999,
            image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
            attributes: {
                hasVariants: true,
                isAvailable: true,
                images: [],
                variantOptions: tsOptions,
                variantCombinations: generateCombos(tsOptions, tsPrices, 15),
            }
        },
        {
            store_id: storeId,
            name: "طاولة قهوة مستديرة",
            description: "طاولة قهوة بتصميم عصري وألوان تناسب جميع الديكورات.",
            price: 120.00,
            section_id: sectionId,
            stock_quantity: 50,
            image_url: 'https://images.unsplash.com/photo-1533090161767-e6f962883de2?auto=format&fit=crop&w=800&q=80',
            attributes: {
                hasVariants: true,
                isAvailable: true,
                images: [],
                variantOptions: tableOptions,
                variantCombinations: generateCombos(tableOptions, tablePrices, 120),
            }
        },
        {
            store_id: storeId,
            name: "حذاء رياضي للمشي",
            description: "حذاء رياضي مريح جداً للمشي والجري لمسافات طويلة.",
            price: 45.00,
            section_id: sectionId,
            stock_quantity: 100,
            image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            attributes: {
                hasVariants: true,
                isAvailable: true,
                images: [],
                variantOptions: shoesOptions,
                variantCombinations: generateCombos(shoesOptions, {}, 45),
            }
        }
    ];

    const { error: insertError } = await supabase.from('products').insert(products);
    if (insertError) {
        console.error('Failed to insert products', insertError);
    } else {
        console.log('Successfully inserted 3 products with variants');
    }
}
run();
