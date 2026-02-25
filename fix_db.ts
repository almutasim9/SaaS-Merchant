import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fix() {
  const { data: stores, error: storesErr } = await supabase.from('stores').select('id, name, subscription_type, plan_id, merchant_id');
  const { data: plans, error: plansErr } = await supabase.from('subscription_plans').select('*');

  if (plansErr || storesErr) {
    console.error('Error fetching data', { storesErr, plansErr });
    return;
  }

  console.log('Available Plans:', plans.map(p => ({ id: p.id, name_en: p.name_en })));
  
  for (const s of stores || []) {
    // Determine target plan name
    let targetName = s.subscription_type;
    // Default to Free if null
    if (!targetName) targetName = 'Free';
    
    const matchingPlan = plans.find(p => p.name_en?.toLowerCase() === targetName?.toLowerCase());
    
    if (matchingPlan) {
        if (s.plan_id !== matchingPlan.id) {
            console.log(`Updating store '${s.name}' from target ${targetName} -> plan_id ${matchingPlan.id}`);
            const { error: updateErr } = await supabase.from('stores').update({ plan_id: matchingPlan.id }).eq('id', s.id);
            if (updateErr) console.error('Update error:', updateErr);
            else console.log(`Successfully fixed '${s.name}'`);
        } else {
            console.log(`Store '${s.name}' is already fully synced with plan ${targetName}.`);
        }
    } else {
        console.log(`Could not find a valid plan for store '${s.name}' (Requested type: ${s.subscription_type})`);
    }
  }
}

fix();
