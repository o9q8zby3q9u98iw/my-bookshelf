export async function onRequestPost(context) {
  // IMPORTANT: Replace the link below with your actual Google Apps Script Web App URL!
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec";
  
  try {
    const requestData = await context.request.json();
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // <--- THIS IS THE MAGIC LINE GOOGLE NEEDS
      },
      body: JSON.stringify(requestData)
    });
    
    // Google sometimes returns raw text on redirects, so we parse it safely
    const rawText = await response.text(); 
    
    return new Response(rawText, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to send message" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
