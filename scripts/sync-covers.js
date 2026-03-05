const fs = require('fs');
const path = require('path');

// Use your raw GOOGLE_SCRIPT_URL to bypass Cloudflare's bot protection
const API_URL = process.env.API_URL || 'https://www.charlesmhershey.com/api/books'; 
const COVERS_DIR = path.join(__dirname, '../images/covers');
const BACKUP_PATH = path.join(__dirname, '../backup.json');

async function syncDataAndCovers() {
    if (!API_URL) {
        console.error("No API_URL provided.");
        process.exit(1);
    }

    if (!fs.existsSync(COVERS_DIR)){
        fs.mkdirSync(COVERS_DIR, { recursive: true });
    }

    try {
        console.log(`Fetching latest database JSON from ${API_URL}...`);
        
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data && data.books) {
            console.log(`Found ${data.books.length} books. Checking covers...`);
            
            for (let book of data.books) {
                if (book.cover && book.cover.includes('drive.google.com')) {
                    const filename = `${book.id}.jpg`;
                    const filepath = path.join(COVERS_DIR, filename);
                    
                    try {
                        await downloadImage(book.cover, filepath);
                        // Once successfully downloaded, rewrite the URL in our payload to the local path
                        book.cover = `images/covers/${filename}`;
                        console.log(`Synced cover for: ${book.title}`);
                    } catch (err) {
                        console.error(`Failed to download cover for ${book.title}:`, err.message);
                    }
                }
            }
        }

        // Overwrite backup.json with the freshly downloaded data AND localized image paths
        fs.writeFileSync(BACKUP_PATH, JSON.stringify(data, null, 2));
        console.log("Database backup and covers synced successfully!");

    } catch (err) {
        console.error("Critical error syncing data:", err);
        process.exit(1);
    }
}

// Smarter download function that follows Google's redirects
async function downloadImage(url, filepath) {
    if (fs.existsSync(filepath)) {
        return; // Skip if we already downloaded it previously
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Status Code: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);
}

syncDataAndCovers();