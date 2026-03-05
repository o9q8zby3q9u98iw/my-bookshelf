# My Minimalist Bookshelf & Portfolio

A clean, lightning-fast personal website featuring a dynamic bookshelf, a glassmorphism contact form, and an AI-powered summary integration. Built with vanilla HTML/CSS/JS and powered by a serverless Cloudflare + Google Sheets backend, allowing you to use a simple Google Sheet as a personal book tracker that automatically updates your live website.

## 🚀 Features

* **Live Book Tracker Integration:** Uses a Google Sheet to track your reading list. Any book added to the spreadsheet automatically and instantly updates on the live website.
* **Bulletproof Fallback System:** If the live Google API ever crashes, times out, or gets blocked, the site instantly catches the error and seamlessly falls back to a locally cached `backup.json` database and locally hosted cover images. This guarantees 100% uptime and zero disruption to the user experience.
* **Automated Image Syncing:** Features a custom Node.js script (`scripts/sync-covers.js`) that automatically downloads Google Drive image links and converts them into optimized, locally hosted images to prevent hotlinking and improve load times.
* **GitHub Actions CI/CD:** A scheduled GitHub Action automatically runs the Node.js sync script in the background to fetch new database entries, download new cover images, and push the updates directly to the repository.
* **Enterprise-Grade Security:** The raw Google Apps Script database URL is completely hidden from the public. It is securely routed through a Cloudflare API proxy and encrypted using GitHub Secrets and Cloudflare Environment Variables.
* **Smart Sorting & Searching:** Filter by title or author instantly entirely client-side.

## 🛠️ Architecture & Data Flow

1.  **Database:** A private Google Sheet stores book metadata (Title, Author, Cover Image URL, Status).
2.  **API Bridge:** A Google Apps Script converts the sheet data into a JSON feed.
3.  **Cloudflare Proxy:** A Cloudflare Worker/Pages function (`/api/books`) securely fetches the raw Google data, bypassing CORS issues and hiding the backend URL from the public frontend.
4.  **Frontend Generation:** Vanilla JavaScript fetches the Cloudflare API and dynamically generates the HTML bookshelf layout.
5.  **Automated Backup:** GitHub Actions periodically triggers `sync-covers.js`, which hits the API, downloads new cover images to `/images/covers/`, and generates a fallback `backup.json`. 

## 💻 Local Development & Setup

To run the backup script locally and sync your covers:

1. Clone the repository.
2. Ensure Node.js is installed.
3. Run the sync script:
   ```bash
   node scripts/sync-covers.js
