# My Minimalist Bookshelf & Portfolio

A clean, lightning-fast personal website featuring a dynamic bookshelf, a glassmorphism contact form, and an AI-powered summary integration. Built with vanilla HTML/CSS/JS and powered by a serverless Cloudflare + Google Sheets backend.

## 🚀 Features
* **Dynamic Bookshelf:** Loads books live from a Google Sheet.
* **Smart Sorting & Searching:** Filter by title or author instantly.
* **AI Integration:** One-click ChatGPT prompts for book summaries.
* **Serverless Contact Form:** Sends messages straight to your email/sheet.
* **Minimalist UI:** Apple-inspired design with shimmer loading effects and glassmorphism.

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
2. Navigate to `/functions/api/books.js` and `/functions/api/contact.js`.
3. Replace the `GOOGLE_SCRIPT_URL` variable with the Web App URL you copied in Step 3.
4. Replace the `WebsiteProfilePhoto/profile.png` with your own headshot.
5. Open `index.html` and `bookshelf.html` to update the social/LinkedIn links in the `<nav>` tags.

### Step 5: Deploy
This project uses Cloudflare Pages Functions for the `/api/` routes. 
1. Go to your Cloudflare Dashboard and select **Pages**.
2. Connect your GitHub repository.
3. Leave the build command blank and set the build directory to the root (`/`).
4. Click Deploy! Cloudflare will automatically detect the `/functions` folder and route your API calls securely.
