export async function onRequestPost(context) {
  // Your NEW Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfg_flnVU17m0_A63w3UBkGbViqiTW7X0vNCAqSXKIoSZzHR0Zw-WtoHX_hs4MEXcs/exec";
  
  try {
    const requestData = await context.request.json();
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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