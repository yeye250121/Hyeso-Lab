const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../.dev/carddatas.md');
const cardsJsonPath = path.join(__dirname, '../data/cards.json');

// Helper to convert TSV tables into Markdown tables
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
    return out.join('\n');
}

// Very basic heuristic parser for the sample data
// In production, having a clear delimiter like `***` between benefits is recommended.
function parseCardBlock(blockText) {
    const benefits = [];
    
    // Split by 2 or more newlines to get chunks
    const chunks = blockText.split(/\n\s*\n/).map(c => c.trim()).filter(Boolean);
    
    let currentBenefit = null;
    let contentLines = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Heuristic: If chunk has no bullets and is very short, it MIGHT be a category.
        // And the next chunk is the title.
        // We will assume a Category is a single line, <= 20 chars, no special symbols at start.
        if (chunk.length <= 30 && !chunk.startsWith('-') && !chunk.startsWith('*') && !chunk.includes('\n')) {
            // It might be a category. Let's check the next chunk (Title).
            if (i + 1 < chunks.length) {
                // Save previous benefit if exists
                if (currentBenefit) {
                    currentBenefit.content = processContent(contentLines.join('\n\n'));
                    benefits.push(currentBenefit);
                }
                
                currentBenefit = {
                    category: chunk,
                    title: chunks[i+1].replace(/\n/g, ' ').trim(),
                    content: ''
                };
                contentLines = [];
                i++; // Skip the title chunk
                continue;
            }
        }
        
        if (currentBenefit) {
            contentLines.push(chunk);
        }
    }
    
    if (currentBenefit) {
        currentBenefit.content = processContent(contentLines.join('\n\n'));
        benefits.push(currentBenefit);
    }
    
    return benefits;
}

function run() {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const cardBlocks = rawData.split(/\n---\n/).map(b => b.trim()).filter(Boolean);
    
    const targetCardNames = ['신한카드 Mr.Life', 'KB국민 굿데이카드', '삼성 iD SELECT ALL 카드'];
    
    let cards = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    let updatedCount = 0;
    
    cardBlocks.forEach((block, index) => {
        const targetName = targetCardNames[index];
        if (!targetName) return;
        
        const parsedBenefits = parseCardBlock(block);
        
        const cardIndex = cards.findIndex(c => c.name === targetName);
        if (cardIndex !== -1) {
            cards[cardIndex].main_benefits = parsedBenefits;
            updatedCount++;
            console.log(`Updated ${targetName} with ${parsedBenefits.length} benefits.`);
        }
    });
    
    if (updatedCount > 0) {
        fs.writeFileSync(cardsJsonPath, JSON.stringify(cards, null, 2), 'utf8');
        console.log('cards.json successfully updated.');
    }
}

run();
