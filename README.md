# My Minimalist Bookshelf & Portfolio

A clean, lightning-fast personal website featuring a dynamic bookshelf, a glassmorphism contact form, and an AI-powered summary integration. Built with vanilla HTML/CSS/JS and powered by a serverless Cloudflare + Google Sheets backend, allowing you to use a simple Google Sheet as a personal book tracker that automatically updates your live website.

## 🚀 Features

* **Lightning-Fast "Local-First" Loading:** Uses a professional *Stale-While-Revalidate* strategy. The site instantly loads a locally cached `backup.json` for ~50ms load times, then silently checks the live database in the background to update the screen and cache seamlessly if new books are found.
* **Live Book Tracker Integration:** Uses a Google Sheet to track your reading list. Any book added to the spreadsheet automatically syncs to the live website.
* **Automated Image Syncing:** Features a custom Node.js script (`scripts/sync-covers.js`) that automatically downloads Google Drive image links and converts them into optimized, locally hosted images to prevent hotlinking and improve load times.
* **GitHub Actions CI/CD:** A scheduled GitHub Action automatically runs the Node.js sync script daily (or manually via dispatch) to fetch new database entries, download new cover images, and push the updates directly to the repository.
* **Enterprise-Grade Security:** The raw Google Apps Script database URL is completely hidden from the public. It is securely routed through a Cloudflare API proxy for visitors, and encrypted using GitHub Secrets for the automated backend syncing.
* **Smart Sorting & Searching:** Filter by title or author instantly, entirely client-side.

## 🛠️ Architecture & Data Flow

1.  **Database:** A private Google Sheet stores book and profile metadata.
2.  **API Bridge:** A Google Apps Script converts the sheet data into a JSON feed.
3.  **Cloudflare Proxy:** A Cloudflare Worker/Pages function (`/api/books` & `/api/contact`) securely routes requests, bypassing CORS issues and hiding the backend URL from the public frontend.
4.  **Frontend Generation:** Vanilla JavaScript immediately paints the UI using `backup.json` (Local-First), then queries the Cloudflare API in the background to update the cache if changes occurred.
5.  **Automated Backup & Sync:** GitHub Actions periodically triggers `sync-covers.js` using a secure `GOOGLE_SCRIPT_URL` secret (to bypass Cloudflare bot protection). It hits the raw API, downloads new cover images to `/images/covers/`, and generates the fallback `backup.json`. 

## 💻 Local Development & Setup

### Running the Sync Script Locally
To run the backup script locally to download new covers:

1. Clone the repository and ensure Node.js is installed.
2. To bypass Cloudflare bot protection locally, set your raw Google Script URL as an environment variable before running:
   ```bash
   export API_URL="[https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec](https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec)"
   node scripts/sync-covers.js
