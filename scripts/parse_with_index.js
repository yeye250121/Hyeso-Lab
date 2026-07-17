const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../.dev/carddatas_category_title.md');
const allDataPath = path.join(__dirname, '../.dev/carddatas_all.md');
const cardsJsonPath = path.join(__dirname, '../data/cards.json');

// Helper to convert TSV to Markdown tables
function processContent(text) {
    const lines = text.split('\n');
    let out = [];
    let inTable = false;
    
    for (let line of lines) {
        if (line.includes('\t')) {
            const cells = line.split('\t').map(c => c.trim());
            out.push('| ' + cells.join(' | ') + ' |');
            if (!inTable) {
                out.push('| ' + cells.map(() => '---').join(' | ') + ' |');
                inTable = true;
            }
        } else {
            if (inTable && line.trim() === '') {
                inTable = false;
            }
            out.push(line);
        }
    }
    return out.join('\n').trim();
}

function parseIndex() {
    const indexRaw = fs.readFileSync(indexPath, 'utf8');
    const blocks = indexRaw.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);
    
    const cardsIndex = [];
    
    for (let block of blocks) {
        const lines = block.split('\n').map(l => l.trim());
        const cardName = lines[0]; // First line is card name
        
        const pairs = [];
        let currentCategory = null;
        
        // Start from line 1
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            
            if (currentCategory === null) {
                currentCategory = line;
            } else {
                pairs.push({
                    category: currentCategory,
                    title: line
                });
                currentCategory = null;
            }
        }
        
        cardsIndex.push({
            name: cardName,
            pairs: pairs
        });
    }
    
    return cardsIndex;
}

function run() {
    const cardsIndex = parseIndex();
    const allRaw = fs.readFileSync(allDataPath, 'utf8');
    const allBlocks = allRaw.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);
    
    if (cardsIndex.length !== allBlocks.length) {
        console.error(`Mismatch! Index has ${cardsIndex.length} cards, AllData has ${allBlocks.length} cards.`);
        return;
    }
    
    let cards = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    let updatedCount = 0;
    
    for (let j = 0; j < cardsIndex.length; j++) {
        const cardInfo = cardsIndex[j];
        const blockText = allBlocks[j];
        const pairs = cardInfo.pairs;
        
        const main_benefits = [];
        
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            
            // Find the title in the block
            const titleIndex = blockText.indexOf(pair.title);
            if (titleIndex === -1) {
                console.warn(`Could not find title: "${pair.title}" in card: ${cardInfo.name}`);
                continue;
            }
            
            const contentStart = titleIndex + pair.title.length;
            let contentEnd = blockText.length;
            
            if (i < pairs.length - 1) {
                const nextPair = pairs[i + 1];
                const nextCatIndex = blockText.indexOf(nextPair.category, contentStart);
                if (nextCatIndex !== -1) {
                    contentEnd = nextCatIndex;
                } else {
                    console.warn(`Could not find next category: "${nextPair.category}" in card: ${cardInfo.name}`);
                }
            }
            
            let contentRaw = blockText.substring(contentStart, contentEnd).trim();
            
            // Sometimes the title is repeated immediately inside the content, let's clean it if so (optional)
            // if (contentRaw.startsWith(pair.title)) {
            //    contentRaw = contentRaw.substring(pair.title.length).trim();
            // }
            
            main_benefits.push({
                category: pair.category,
                title: pair.title,
                content: processContent(contentRaw)
            });
        }
        
        // Find card in cards.json by loose name matching (e.g. "굿데이카드" vs "KB국민 굿데이카드")
        const cardMatchIndex = cards.findIndex(c => c.name.includes(cardInfo.name) || cardInfo.name.includes(c.name));
        
        if (cardMatchIndex !== -1) {
            cards[cardMatchIndex].main_benefits = main_benefits;
            console.log(`Successfully parsed and updated "${cards[cardMatchIndex].name}" with ${main_benefits.length} benefits.`);
            updatedCount++;
        } else {
            console.warn(`Card "${cardInfo.name}" not found in cards.json!`);
        }
    }
    
    if (updatedCount > 0) {
        fs.writeFileSync(cardsJsonPath, JSON.stringify(cards, null, 2), 'utf8');
        console.log(`cards.json updated successfully with ${updatedCount} cards.`);
    }
}

run();
