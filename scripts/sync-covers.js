const fs = require('fs');
const path = require('path');
const https = require('https');

// Expects your Cloudflare API url to fetch the raw data (e.g., https://yourdomain.com/api/books) 
// Or you can use your raw GOOGLE_SCRIPT_URL
const API_URL = process.env.API_URL; 
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
        // We use native fetch (available in Node 18+)
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data && data.books) {
            console.log(`Found ${data.books.length} books. Checking covers...`);
            
            for (let book of data.books) {
                if (book.cover && book.cover.includes('drive.google.com')) {
                    // Extract ID and build local filename
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

// Promise wrapper to handle downloading binary image data via HTTPS
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filepath)) {
            resolve(); // Skip if we already downloaded it previously
            return;
        }
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Status Code: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
}

syncDataAndCovers();
