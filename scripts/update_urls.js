const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://urxbdqmrsfzmztkacfiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGJkcW1yc2Z6bXp0a2FjZml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzA3MjYsImV4cCI6MjA5OTAwNjcyNn0.df_Uqx1mWx2DrId5mnm-5jLf6gzT531oV897F7NrkJo';

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'HYESO-LAB';

// Regex to find signed URLs
const urlRegex = /https:\/\/urxbdqmrsfzmztkacfiv\.supabase\.co\/storage\/v1\/object\/sign\/HYESO-LAB\/([^'"]+)/g;

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let match;
            const updates = [];
            
            // Collect all unique paths
            const pathsToUpdate = new Map();
            while ((match = urlRegex.exec(content)) !== null) {
                const fullUrl = match[0];
                const filePathWithQuery = match[1];
                // Extract file path without query string
                const filePath = filePathWithQuery.split('?')[0];
                const decodedFilePath = decodeURIComponent(filePath);
                
                pathsToUpdate.set(fullUrl, decodedFilePath);
            }

            if (pathsToUpdate.size > 0) {
                console.log(`Found URLs in ${fullPath}`);
                let contentUpdated = content;
                for (const [oldUrl, filePath] of pathsToUpdate.entries()) {
                    // Create signed URL for 1 year (31536000 seconds)
                    const { data, error } = await supabase.storage
                        .from(BUCKET)
                        .createSignedUrl(filePath, 31536000);
                        
                    if (error) {
                        console.error(`Error generating URL for ${filePath}:`, error.message);
                    } else if (data && data.signedUrl) {
                        console.log(`Updated URL for ${filePath}`);
                        contentUpdated = contentUpdated.replaceAll(oldUrl, data.signedUrl);
                    }
                }
                if (content !== contentUpdated) {
                    fs.writeFileSync(fullPath, contentUpdated, 'utf8');
                    console.log(`Saved changes to ${fullPath}`);
                }
            }
        }
    }
}

processDirectory(path.join(__dirname, '../app')).then(() => {
    console.log('Done processing.');
});
