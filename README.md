# My Minimalist Bookshelf & Portfolio

A clean, lightning-fast personal website featuring a dynamic bookshelf, a glassmorphism contact form, and an AI-powered summary integration. Built with vanilla HTML/CSS/JS and powered by a serverless Cloudflare + Google Sheets backend.

## 🚀 Features
* **Dynamic Bookshelf:** Loads books live from a Google Sheet.
* **Smart Sorting & Searching:** Filter by title or author instantly entirely client-side.
* **AI Integration:** One-click ChatGPT prompts for book summaries.
* **Serverless Contact Form:** Sends messages straight to your email/sheet.
* **Minimalist UI:** Apple-inspired design with shimmer loading effects and glassmorphism.
* **Modular Architecture:** Utilizes split CSS (`global.css`, `home.css`, `bookshelf.css`) and a vanilla JS Web Component (`nav.js`) for easy maintenance.
* **Secure Endpoints:** API URLs are hidden using Cloudflare Secret Environment Variables.

---

## 🛠️ How to Replicate This Site

To build your own version of this site, you'll need a Google Account (for the database and image hosting) and a Cloudflare Account (for hosting the site and API proxies).

### Step 1: Set Up Your Google Sheet (The Database)
This site uses a Google Sheet as a free, easy-to-edit CMS. 
1. Create a new Google Sheet.
2. Create two tabs (worksheets) at the bottom: **Books** and **Home**.
3. **In the "Books" tab**, create the following headers in row 1 exactly like this:
   * `title`
   * `author`
   * `cover` 
   * `summary`
   * `amazonLink`
4. **In the "Home" tab**, create columns to control your homepage text dynamically:
   * `Name` (e.g., Jane Doe)
   * `Bio` (e.g., Welcome to my personal library...)

### Step 2: Managing Cover Images (Google Drive & Open Library)
The book covers displayed on this site are stored in **Google Drive** and linked in the `cover` column of the Google Sheet.
* **Automated Collection:** The cover image files were originally collected, saved, and named using a one-time script that fetched the artwork directly from the Open Library API.
* **Adding New Covers:** When adding a new book, upload the cover image to your Google Drive. Make sure the file's sharing permissions are set to "Anyone with the link." You will need to convert the standard Google Drive share link into a direct image link format (e.g., changing `file/d/[IMAGE_ID]/view` to `uc?export=view&id=[IMAGE_ID]`) before pasting it into your spreadsheet so the website can render it properly.

### Step 3: Create the Google Apps Script (The API)
You need to expose your Google Sheet as a JSON API.
1. In your Google Sheet, click **Extensions > Apps Script**.
2. Write a script with `doGet()` to output your sheet data as JSON, and `doPost()` to accept contact form submissions.
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
4. Click **Deploy**!
5. **CRITICAL STEP:** Once deployed, go to your project **Settings > Variables and Secrets**.
6. Under both **Production** and **Preview** environments, add a new variable:
   * **Type:** Select `Secret`
   * **Variable name:** `GOOGLE_SCRIPT_URL`
   * **Value:** Paste your Google Apps Script Web App URL from Step 3 here.
7. Save the variables and trigger a new deployment via the **Deployments** tab so the changes take effect.

---

### 🔐 Updating the API Link in the Future
If you ever deploy a new version of your Google Apps Script and generate a new URL, you must update it in Cloudflare:
1. Log into your Cloudflare Dashboard -> **Workers & Pages** -> your project.
2. Go to **Settings > Variables and Secrets**.
3. Edit the `GOOGLE_SCRIPT_URL` variable for both Production and Preview.
4. Go to the **Deployments** tab and click **Retry deployment** on your latest build for the new URL to take effect.
