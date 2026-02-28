export async function onRequest(context) {
  // IMPORTANT: Replace the link below with your actual Google Apps Script Web App URL from Step 1!
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwV1uh6FRjnCP6kNJD8acWXq-IYKMkyq6mO1VLKNyXtPTRfSqfo6rzCS4BkpHCbDPnx/exec";

  try {
    // 1. Fetch the JSON securely from your Google Apps Script URL
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();

    // 2. Pass it to your frontend with open CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch library" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
