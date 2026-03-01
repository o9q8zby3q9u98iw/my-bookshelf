# My Minimalist Bookshelf & Portfolio

A clean, lightning-fast personal website featuring a dynamic bookshelf, a glassmorphism contact form, and an AI-powered summary integration. Built with vanilla HTML/CSS/JS and powered by a serverless Cloudflare + Google Sheets backend, allowing you to use a simple Google Sheet as a personal book tracker that automatically updates your live website.

## 🚀 Features
* **Live Book Tracker Integration:** Use a Google Sheet to track your reading list. Any book you add to the spreadsheet automatically and instantly updates on your live website.
* **Smart Sorting & Searching:** Filter by title or author instantly entirely client-side.
* **AI Integration:** One-click ChatGPT prompts for book summaries.
* **Serverless Contact Form:** Sends messages straight to your email/sheet.
* **Minimalist UI:** Apple-inspired design with shimmer loading effects and glassmorphism.
* **Modular Architecture:** Utilizes split CSS (`global.css`, `home.css`, `bookshelf.css`) and a vanilla JS Web Component (`nav.js`) for easy maintenance.
* **Secure Endpoints:** API URLs are hidden using Cloudflare Secret Environment Variables.

---

## 🛠️ How to Replicate This Site

To build your own version of this site, you'll need a Google Account (for the database and image hosting) and a Cloudflare Account (for hosting the site and API proxies).

### Step 1: Set Up Your Google Sheet Book Tracker (The Database)
This site uses a Google Sheet as a free, easy-to-edit CMS and reading tracker. When you add a row here, your website updates automatically.
1. Create a new Google Sheet.
2. Create two tabs (worksheets) at the bottom: **Bookshelf** and **HomePage**.
3. **In the "Bookshelf" tab**, structure your columns exactly like this so the script can read them:
   * Column A: `ID`
   * Column B: `Title`
   * Column C: `Author`
   * Column D: `Filename` (e.g., book-cover.jpg)
   * Column E: `Amazon Link`
   * Column F: `ISBN`
   * Column G: *(Leave blank or use for notes)*
   * Column H: `Summary`
4. **In the "HomePage" tab**, create two columns to control your homepage text dynamically:
   * Row 1: Column A = `Name`, Column B = `[Your Name]`
   * Row 2: Column A = `Bio`, Column B = `[Your Bio Text]`

### Step 2: Managing Cover Images (Google Drive & Auto-Thumbnails)
The book covers displayed on this site are stored in **Google Drive** and automatically optimized for speed.
1. Create a folder in your Google Drive named exactly **Verified Book Covers**. 
2. Upload your cover images into this folder. Make sure the folder's sharing permissions are set to "Anyone with the link."
3. **Adding New Covers:** When adding a new book to your spreadsheet tracker, simply type the exact filename (e.g., `harry-potter.jpg`) into Column D. 
4. *How it works:* The Google Apps Script API will automatically search the "Verified Book Covers" folder, find the matching file, and generate a lightning-fast, 250px-wide thumbnail on the fly. You do *not* need to manually paste heavy image links!

### Step 3: Create the Google Apps Script (The API)
You need to expose your Google Sheet as a JSON API so your website can read your book tracker.
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Paste the `doGet()` and `doPost()` script to output your sheet data as JSON and accept form submissions.
3. Click **Deploy > New Deployment**.
4. Choose **Web app**. Set "Execute as" to **Me** and "Who has access" to **Anyone**.
5. Copy the generated **Web App URL**.

### Step 4: Configure the Code
1. Clone this repository.
2. Replace the `WebsiteProfilePhoto/profile.png` with your own headshot.
3. Open `js/nav.js` to update the social/LinkedIn link in the `<nav>` template. *(Because this project uses a Web Component for the navigation, you only have to update it in this one file!)*

### Step 5: Deploy & Set Environment Variables
This project uses Cloudflare Pages Functions for the `/api/` routes and securely pulls your Google Script URL from environment variables.
1. Go to your Cloudflare Dashboard and select **Pages**.
2. Connect your GitHub repository.
3. Leave the build command blank and set the build directory to the root (`/`).
4. Click **Deploy**! Cloudflare will automatically detect the `/functions` folder.
5. **CRITICAL STEP:** Once deployed, go to your project **Settings > Variables and Secrets**.
6. Under both **Production** and **Preview** environments, add a new variable:
   * **Type:** Select `Secret`
   * **Variable name:** `GOOGLE_SCRIPT_URL`
   * **Value:** Paste your Google Apps Script Web App URL from Step 3 here.
7. Save the variables and trigger a new deployment via the **Deployments** tab so the secure link takes effect.

---

### 🔐 Updating the API Link in the Future
If you ever deploy a new version of your Google Apps Script and generate a new URL, you must update it in Cloudflare:
1. Log into your Cloudflare Dashboard -> **Workers & Pages** -> your project.
2. Go to **Settings > Variables and Secrets**.
3. Edit the `GOOGLE_SCRIPT_URL` variable for both Production and Preview.
4. Go to the **Deployments** tab and click **Retry deployment** on your latest build for the new URL to take effect.
