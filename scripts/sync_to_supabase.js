const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase server environment variables are required.');

const supabase = createClient(supabaseUrl, supabaseKey);
const cardsJsonPath = path.join(__dirname, '../data/cards.json');

async function syncData() {
    const cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    console.log(`Found ${cardsData.length} cards in local JSON.`);
    
    let successCount = 0;
    
    for (const card of cardsData) {
        // We will update the row if it exists, or insert it.
        // Wait, Supabase UPSERT might overwrite card_image_url if we provide a null or don't specify it, but actually upsert overwrites entire row.
        // So let's first check if the card exists.
        
        const { data: existing, error: fetchErr } = await supabase
            .from('cards')
            .select('*')
            .eq('id', card.id)
            .single();
            
        if (existing) {
            // Update only the fields we parsed, preserving card_image_url
            console.log(`Updating existing card: ${card.name}`);
            const updatePayload = {
                main_benefits: card.main_benefits || null,
                benefits: card.benefits || null,
                promo: card.promo || null,
                condition: card.condition || null,
                fees: card.fees || null,
                type: card.type || null,
                company: card.company || null,
                name: card.name || null
            };
            
            const { error: updateErr } = await supabase
                .from('cards')
                .update(updatePayload)
                .eq('id', card.id);
                
            if (updateErr) {
                console.error(`Error updating ${card.name}:`, updateErr.message);
            } else {
                successCount++;
            }
        } else {
            // Insert
            console.log(`Inserting new card: ${card.name}`);
            const insertPayload = {
                id: card.id,
                main_benefits: card.main_benefits || null,
                benefits: card.benefits || null,
                promo: card.promo || null,
                condition: card.condition || null,
                fees: card.fees || null,
                type: card.type || null,
                company: card.company || null,
                name: card.name || null
            };
            
            const { error: insertErr } = await supabase
                .from('cards')
                .insert([insertPayload]);
                
            if (insertErr) {
                console.error(`Error inserting ${card.name}:`, insertErr.message);
            } else {
                successCount++;
            }
        }
    }
    
    console.log(`Successfully synced ${successCount} out of ${cardsData.length} cards to Supabase.`);
}

syncData();
