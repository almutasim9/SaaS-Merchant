import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const newFees = {
        "zones": [
            {
                "id": "manual-1",
                "fee": 5000,
                "name": "توصيل بغداد",
                "cities": ["بغداد"],
                "enabled": true
            },
            {
                "id": "manual-2",
                "fee": 8000,
                "name": "باقي المحافظات",
                "cities": [
                    "البصرة", "أربيل", "السليمانية", "دهوك", "كركوك", "النجف", "كربلاء",
                    "الحلة", "الأنبار", "الديوانية", "الكوت", "العمارة", "الناصرية",
                    "السماوة", "ديالى", "صلاح الدين"
                ],
                "enabled": true
            },
            {
                "id": "manual-3",
                "fee": 2000,
                "name": "الموصل",
                "cities": ["الموصل"],
                "enabled": true
            }
        ],
        "isFreeDelivery": false
    };

    const { error } = await supabase
        .from('stores')
        .update({ delivery_fees: newFees })
        .eq('slug', 'omar-store');

    if (error) {
        console.error('Error updating store:', error);
    } else {
        console.log('Successfully updated omar-store to new delivery fee format.');
    }
}

run();
