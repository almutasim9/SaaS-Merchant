
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data: stores } = await supabase.from('stores').select('id, subscription_type');
    const { data: plans } = await supabase.from('subscription_plans').select('id, name_en');
    for (const s of stores || []) {
        const matchingPlan = plans.find(p => p.name_en === (s.subscription_type || 'Free'));
        if (matchingPlan) {
            await supabase.from('stores').update({ plan_id: matchingPlan.id }).eq('id', s.id);
            console.log('Fixed store to', matchingPlan.name_en);
        }
    }
})();

